import firestore from '../adaptor'
import { Collection } from '../collection'
import { Ref, ref } from '../ref'
import { Doc, doc } from '../doc'
import { unwrapData } from '../data'
import { ModelUpdate } from '../update'
import { Field } from '../field'

/**
 * Creates batch.
 *
 * @returns Batch API (set, update, clear, commit)
 *
 * @example
 * import { batch, collection } from 'typesaurus'
 *
 * type Counter = { count: number }
 * const counters = collection<Counter>('counters')
 *
 * const { set, update, clear, commit } = batch()
 *
 * for (let count = 0; count < 500; count++) {
 *   set(counters, count.toString(), { count })
 * }
 *
 * commit().then(() => console.log('Done!'))
 */
export function batch() {
  const firestoreBatch = firestore().batch()

  /**
   * @param ref - The reference to the document to set
   * @param data - The document data
   */
  function set<Model>(ref: Ref<Model>, data: Model): Doc<Model>

  /**
   * @param collection - The collection to set document in
   * @param id - The id of the document to set
   * @param data - The document data
   */
  function set<Model>(
    collection: Collection<Model>,
    id: string,
    data: Model
  ): Doc<Model>

  /**
   * Sets a document to the given data.
   *
   * @returns The document
   *
   * @example
   * import { batch, collection } from 'typesaurus'
   *
   * type Counter = { count: number }
   * const counters = collection<Counter>('counters')
   *
   * const { set, commit } = batch()
   *
   * for (let count = 0; count < 500; count++) {
   *   set(counters, count.toString(), { count })
   * }
   *
   * commit()
   */
  function set<Model>(
    collectionOrRef: Collection<Model> | Ref<Model>,
    idOrData: string | Model,
    maybeData?: Model
  ): Doc<Model> {
    let collection: Collection<Model>
    let id: string
    let data: Model

    if (collectionOrRef.__type__ === 'collection') {
      collection = collectionOrRef as Collection<Model>
      id = idOrData as string
      data = maybeData as Model
    } else {
      const ref = collectionOrRef as Ref<Model>
      collection = ref.collection
      id = ref.id
      data = idOrData as Model
    }

    const firestoreDoc = firestore()
      .collection(collection.path)
      .doc(id)
    // ^ above
    // TODO: Refactor code above and below because is all the same as in the regular set function
    firestoreBatch.set(firestoreDoc, unwrapData(data))
    // v below
    return doc(ref(collection, id), data)
  }

  /**
   * @param collection - The collection to update document in
   * @param id - The id of the document to update
   * @param data - The document data to update
   */
  function update<Model>(
    collection: Collection<Model>,
    id: string,
    data: Field<Model>[]
  ): void

  /**
   * @param ref - The reference to the document to set
   * @param data - The document data to update
   */
  function update<Model>(ref: Ref<Model>, data: Field<Model>[]): void

  /**
   * @param collection - The collection to update document in
   * @param id - The id of the document to update
   * @param data - The document data to update
   */
  function update<Model>(
    collection: Collection<Model>,
    id: string,
    data: ModelUpdate<Model>
  ): void

  /**
   * @param ref - The reference to the document to set
   * @param data - The document data to update
   */
  function update<Model>(ref: Ref<Model>, data: ModelUpdate<Model>): void

  /**
   * @returns void
   *
   * @example
   * import { batch, collection } from 'typesaurus'
   *
   * type Counter = { count: number, meta: { updatedAt: number } }
   * const counters = collection<Counter>('counters')
   *
   * const { update, commit } = batch()
   *
   * for (let count = 0; count < 500; count++) {
   *   update(counters, count.toString(), { count: count + 1 })
   *   // or using key paths:
   *   update(counters, count.toString(), [
   *     ['count', count + 1],
   *     [['meta', 'updatedAt'], Date.now()]
   *   ])
   * }
   *
   * commit()
   */
  function update<Model>(
    collectionOrRef: Collection<Model> | Ref<Model>,
    idOrData: string | Field<Model>[] | ModelUpdate<Model>,
    maybeData?: Field<Model>[] | ModelUpdate<Model>
  ): void {
    let collection: Collection<Model>
    let id: string
    let data: Model

    if (collectionOrRef.__type__ === 'collection') {
      collection = collectionOrRef as Collection<Model>
      id = idOrData as string
      data = maybeData as Model
    } else {
      const ref = collectionOrRef as Ref<Model>
      collection = ref.collection
      id = ref.id
      data = idOrData as Model
    }

    const firebaseDoc = firestore()
      .collection(collection.path)
      .doc(id)
    const updateData = Array.isArray(data)
      ? data.reduce(
          (acc, { key, value }) => {
            acc[Array.isArray(key) ? key.join('.') : key] = value
            return acc
          },
          {} as { [key: string]: any }
        )
      : data
    // ^ above
    // TODO: Refactor code above because is all the same as in the regular update function
    firestoreBatch.update(firebaseDoc, unwrapData(updateData))
  }

  /**
   * @param collection - The collection to remove document in
   * @param id - The id of the documented to remove
   */
  function clear<Model>(collection: Collection<Model>, id: string): void

  /**
   * @param ref - The reference to the document to remove
   */
  function clear<Model>(ref: Ref<Model>): void

  /**
   * Removes a document.
   *
   * @example
   * import { batch, collection } from 'typesaurus'
   *
   * type Counter = { count: number }
   * const counters = collection<Counter>('counters')
   *
   * const { clear, commit } = batch()
   *
   * for (let count = 0; count < 500; count++) {
   *   clear(counters, count.toString())
   * }
   *
   * commit()
   */
  function clear<Model>(
    collectionOrRef: Collection<Model> | Ref<Model>,
    maybeId?: string
  ): void {
    let collection: Collection<Model>
    let id: string

    if (collectionOrRef.__type__ === 'collection') {
      collection = collectionOrRef as Collection<Model>
      id = maybeId as string
    } else {
      const ref = collectionOrRef as Ref<Model>
      collection = ref.collection
      id = ref.id
    }

    const firebaseDoc = firestore()
      .collection(collection.path)
      .doc(id)
    // ^ above
    // TODO: Refactor code above because is all the same as in the regular update function
    firestoreBatch.delete(firebaseDoc)
  }

  /**
   * Starts the execution of the operations in the batch.
   *
   * @returns A promise that resolves when the operations are finished
   */
  async function commit() {
    await firestoreBatch.commit()
  }

  return {
    set,
    update,
    clear,
    commit
  }
}
