import type {Source} from "../source.js";
import type {ObjectSchema} from "../../schemes/object.js";
import type {BaseSchema} from "../../schemes/base.js";
import nano from "nano";
import type {AnyDoc, InjectOpts, LoadOpts, LoadSingleOpts, LoadViewOpts} from "./types.js";
import {inlineCatch} from "./utils.js";

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

export type CouchDBSourceOpts<Name extends string> = {
  name?: Name
}

export function couchdbSource<Name extends string = "couchdb">(opts: CouchDBSourceOpts<Name> = {}): Source<Name, InjectOpts, LoadSingleOpts, LoadOpts> {
  return new CouchDBSource(opts.name ?? "couchdb" as Name)
}
