import {after, before, describe, it} from "node:test";
import {CouchDBContainer, StartedCouchDBContainer} from "@testcontainers/couchdb";
import {object, type ObjectSchema} from "../../schemes/object.js";
import {randomUUID} from "node:crypto";
import nano, {type Document} from "nano";
import {expect} from "expect";
import type {Source} from "../source.js";
import type {BaseSchema} from "../../schemes/base.js";

type AnyDoc = Record<string, unknown>

type InjectOpts = undefined
type LoadSingleOpts = Record<string, unknown>

type LoadViewOpts = {
  designDocument: string
  viewName: string
}
type LoadOpts = {
  url: string
  collection: string
  documentId: string
  view?: LoadViewOpts
}

class CouchDBSource<Name extends string> implements Source<Name, InjectOpts, LoadSingleOpts, LoadOpts> {
  name: Name;

  constructor(name: Name) {
    this.name = name;
  }

  async load(params: LoadOpts, schema: ObjectSchema<Record<string, BaseSchema<unknown>>, boolean>, inject: undefined): Promise<Record<string, unknown>> {
    const {url, collection, documentId, view} = params

    const client = nano(url)
    const db = client.use<AnyDoc>(collection)
    const [document, err] = await inlineCatch(view === undefined ? this.#loadFromDatabase(db, documentId) : this.#loadFromView(db, view, documentId))

    if (err !== undefined) {
      if (this.#isDatabaseNotExistError(err.err)) {
        throw new Error(`CouchDB database named "${collection}" does not exist`)
      }

      if (this.#isAuthenticationError(err.err)) {
        throw new Error('CouchDB authentication failed')
      }

      throw err.err
    }
    return document as unknown as Record<string, unknown>
  }

  async #loadFromView(client: nano.DocumentScope<AnyDoc>, view: LoadViewOpts, documentId: string) {
    const [document, err] = await inlineCatch(client.view(view.designDocument.replace('_design/', ''), view.viewName, {key: documentId}))

    if (err !== undefined) {
      if (this.#isViewMissingError(err.err)) {
        throw new Error(`View "${view.viewName}" does not exist`)
      }

      if (this.#isDesignDocumentMissingError(err.err)) {
        throw new Error(`Design document "${view.designDocument}" does not exist`)
      }

      throw err.err
    }

    const rawDocument = document.rows[0]?.value

    if (rawDocument === undefined) {
      return undefined
    }

    return this.#cleanDocument(rawDocument as nano.DocumentGetResponse)
  }

  async #loadFromDatabase(client: nano.DocumentScope<AnyDoc>, documentId: string) {
    const [document, err] = await inlineCatch(client.get(documentId))

    if (err !== undefined) {
      if (!this.#isDocumentMissingError(err.err)) {
        throw err.err
      }

      return undefined
    }

    return this.#cleanDocument(document)
  }

  #cleanDocument(document: nano.DocumentGetResponse) {
    const {
      _attachments,
      _conflicts,
      _deleted_conflicts,
      _deleted,
      _id,
      _local_seq,
      _rev,
      _revs_info,
      _revisions,
      ...rest
    } = document
    return rest
  }

  #isDocumentMissingError(err: unknown): boolean {
    return typeof err === 'object' && err !== null && 'error' in err && 'reason' in err && err.error === 'not_found' && err.reason === 'missing'
  }

  #isDatabaseNotExistError(err: unknown): boolean {
    return typeof err === 'object' && err !== null && 'message' in err && err.message === "Database does not exist."
  }

  #isAuthenticationError(err: unknown): boolean {
    return typeof err === 'object' && err !== null && 'message' in err && err.message === 'Name or password is incorrect.'
  }

  #isViewMissingError(err: unknown) {
    return typeof err === 'object' && err !== null && 'error' in err && 'reason' in err && err.error === 'not_found' && err.reason === 'missing_named_view'
  }

  #isDesignDocumentMissingError(err: unknown) {
    return typeof err === 'object' && err !== null && 'error' in err && 'reason' in err && err.error === 'not_found' && err.reason === 'missing'
  }
}

function couchdbSource() {
  return new CouchDBSource('couchdb')
}

describe('couchdb source', function () {
  let couchdb!: StartedCouchDBContainer
  let client!: nano.ServerScope

  before(async () => {
    couchdb = await new CouchDBContainer('couchdb:3').start()
    client = nano(couchdb.getUrl())
  })

  after(async () => {
    await couchdb?.stop()
  })

  it('should be able to load config from couchdb', async function () {
    // Given
    const collection = `a${randomUUID()}`
    await client.db.create(collection)
    const {id} = await client.use<AnyDoc>(collection).insert({
      databaseUrl: 'postgres://localhost:5432/baz'
    })
    const source = couchdbSource()

    // When
    const config = await source.load({
      url: couchdb.getUrl(),
      collection,
      documentId: id
    }, object({}), undefined)

    // Then
    expect(config).toEqual({databaseUrl: 'postgres://localhost:5432/baz'})
  })

  it('should be able to return undefined given the document does exist', async function () {
    // Given
    const collection = `a${randomUUID()}`
    await client.db.create(collection)

    const source = couchdbSource()

    // When
    const config = await source.load({
      url: couchdb.getUrl(),
      collection,
      documentId: randomUUID()
    }, object({}), undefined)

    // Then
    expect(config).toBeUndefined()
  })

  it('should be able to throw an error given the database does not exist', async function () {
    // Given
    const collection = `a${randomUUID()}`
    const source = couchdbSource()

    // When
    const promise = source.load({
      url: couchdb.getUrl(),
      collection,
      documentId: randomUUID()
    }, object({}), undefined)

    // Then
    await expect(promise).rejects.toThrow(new Error(`CouchDB database named "${collection}" does not exist`))
  })

  it('should be able to throw given the authentication failed', async function () {
    // Given
    const source = couchdbSource()

    // When
    const promise = source.load({
      url: changePassword(couchdb.getUrl(), 'foo'),
      collection: 'a',
      documentId: 'b'
    }, object({}), undefined)

    // Then
    await expect(promise).rejects.toThrow(new Error('CouchDB authentication failed'))
  })

  describe('view', function () {
    it('should be able to load config from a view', async function () {
      // Given
      const dbName = `a${randomUUID()}`
      await client.db.create(dbName)
      const db = client.use<AnyDoc>(dbName)

      await db.insert({
        _id: '_design/foo',
        views: {
          myView: {
            map: 'function(doc) { emit(doc.tenant, doc) }'
          }
        }
      })

      await db.insert({
        tenant: 'tenant-1',
        dbUrl: 'postgres://localhost:5432/baz'
      })

      const source = couchdbSource()

      // When
      const config = await source.load({
        url: couchdb.getUrl(),
        collection: dbName,
        documentId: 'tenant-1',
        view: {
          designDocument: '_design/foo',
          viewName: 'myView'
        }
      }, object({}), undefined)

      // Then
      expect(config).toEqual({tenant: 'tenant-1', dbUrl: 'postgres://localhost:5432/baz'})
    })

    it('should be able to return undefined if the document does not exist', async function () {
      // Given
      const dbName = `a${randomUUID()}`
      await client.db.create(dbName)
      const db = client.use<AnyDoc>(dbName)

      await db.insert({
        _id: '_design/foo',
        views: {
          myView: {
            map: 'function(doc) { emit(doc.tenant, doc) }'
          }
        }
      })

      const source = couchdbSource()

      // When
      const result = await source.load({
        url: couchdb.getUrl(),
        collection: dbName,
        documentId: 'tenant-1',
        view: {
          designDocument: '_design/foo',
          viewName: 'myView'
        }
      }, object({}), undefined)

      // Then
      expect(result).toBeUndefined()
    })

    it('should be able to throw an error given the view does not exist', async function () {
      // Given
      const dbName = `a${randomUUID()}`
      await client.db.create(dbName)

      const db = client.use<AnyDoc>(dbName)

      await db.insert({
        _id: '_design/foo',
        views: {}
      })

      const source = couchdbSource()

      // When
      const promise = source.load({
        url: couchdb.getUrl(),
        collection: dbName,
        documentId: 'tenant-1',
        view: {
          designDocument: '_design/foo',
          viewName: 'myView'
        }
      }, object({}), undefined)

      // Then
      await expect(promise).rejects.toThrow(new Error('View "myView" does not exist'))
    })

    it('should be able to throw an error given the design doc does not exist', async function () {
      // Given
      const dbName = `a${randomUUID()}`
      await client.db.create(dbName)

      const source = couchdbSource()

      // When
      const promise = source.load({
        url: couchdb.getUrl(),
        collection: dbName,
        documentId: 'tenant-1',
        view: {
          designDocument: '_design/foo',
          viewName: 'myView'
        }
      }, object({}), undefined)

      // Then
      await expect(promise).rejects.toThrow(new Error('Design document "_design/foo" does not exist'))
    })
  })
})

type Success<T> = readonly [result: T, error: undefined]
type Failure = readonly [result: undefined, error: { err: unknown }]

async function inlineCatch<T>(promise: Promise<T>): Promise<Success<T> | Failure> {
  return promise.then(result => [result, undefined] as const).catch(err => [undefined, {err}] as const)
}

function changePassword(url: string, password: string): string {
  const u = new URL(url)
  u.password = password
  return u.toString()
}