import {after, before, describe, it} from "node:test";
import {CouchDBContainer, StartedCouchDBContainer} from "@testcontainers/couchdb";
import {object} from "../../schemes/object.js";
import {randomUUID} from "node:crypto";
import nano from "nano";
import {expect} from "expect";
import {couchdbSource} from "./source.js";
import type {AnyDoc} from "./types.js";

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
    const config = await source.load?.({
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
    const config = await source.load?.({
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
    const promise = source.load?.({
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
    const promise = source.load?.({
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
      const config = await source.load?.({
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
      const result = await source.load?.({
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
      const promise = source.load?.({
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
      const promise = source.load?.({
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

function changePassword(url: string, password: string): string {
  const u = new URL(url)
  u.password = password
  return u.toString()
}