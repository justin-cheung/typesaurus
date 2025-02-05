import assert from 'assert'
import { batch } from '.'
import { collection } from '../collection'
import { ref } from '../ref'
import nanoid from 'nanoid'
import get from '../get'
import set from '../set'

describe('batch', () => {
  type User = { name: string; foo?: boolean }
  const users = collection<User>('users')

  it('performs batch operations', async () => {
    const { set, commit } = batch()
    const id = nanoid()
    const sashaRef = ref(users, `${id}-sasha`)
    const tatiRef = ref(users, `${id}-tati`)
    const edRef = ref(users, `${id}-ed`)
    set(sashaRef, { name: 'Sasha' })
    set(tatiRef, { name: 'Tati' })
    set(edRef, { name: 'Ed' })
    await commit()
    const [sasha, tati, ed] = await Promise.all([
      get(sashaRef),
      get(tatiRef),
      get(edRef)
    ])
    assert(sasha.data.name === 'Sasha')
    assert(tati.data.name === 'Tati')
    assert(ed.data.name === 'Ed')
  })

  it('allows set a new document', async () => {
    const { set, commit } = batch()
    const id = nanoid()
    const sashaRef = ref(users, `${id}-sasha`)
    const tatiRef = ref(users, `${id}-tati`)
    const edRef = ref(users, `${id}-ed`)
    set(sashaRef, { name: 'Sasha' })
    set(tatiRef, { name: 'Tati' })
    set(edRef, { name: 'Ed' })
    await commit()
    const [sasha, tati, ed] = await Promise.all([
      get(sashaRef),
      get(tatiRef),
      get(edRef)
    ])
    assert.deepEqual(sasha, {
      __type__: 'doc',
      ref: { __type__: 'ref', collection: users, id: `${id}-sasha` },
      data: { name: 'Sasha' }
    })
    assert.deepEqual(tati, {
      __type__: 'doc',
      ref: { __type__: 'ref', collection: users, id: `${id}-tati` },
      data: { name: 'Tati' }
    })
    assert.deepEqual(ed, {
      __type__: 'doc',
      ref: { __type__: 'ref', collection: users, id: `${id}-ed` },
      data: { name: 'Ed' }
    })
  })

  it('allows set and overwrite', async () => {
    const { set: batchSet, commit } = batch()
    const id = nanoid()
    const sashaRef = ref(users, `${id}-sasha`)
    const tatiRef = ref(users, `${id}-tati`)
    const edRef = ref(users, `${id}-ed`)
    await Promise.all([
      set(sashaRef, { name: 'Sasha', foo: true }),
      set(tatiRef, { name: 'Tati', foo: true }),
      set(edRef, { name: 'Ed', foo: true })
    ])
    batchSet(sashaRef, { name: 'Sasha Koss' }, { merge: true })
    batchSet(tatiRef, { name: 'Tati Shepeleva', foo: false }, { merge: true })
    batchSet(edRef, { name: 'Ed Tsech' }, { merge: false })
    await commit()
    const [sasha, tati, ed] = await Promise.all([
      get(sashaRef),
      get(tatiRef),
      get(edRef)
    ])
    assert.deepEqual(sasha, {
      __type__: 'doc',
      ref: { __type__: 'ref', collection: users, id: `${id}-sasha` },
      data: { name: 'Sasha Koss', foo: true }
    })
    assert.deepEqual(tati, {
      __type__: 'doc',
      ref: { __type__: 'ref', collection: users, id: `${id}-tati` },
      data: { name: 'Tati Shepeleva', foo: false }
    })
    assert.deepEqual(ed, {
      __type__: 'doc',
      ref: { __type__: 'ref', collection: users, id: `${id}-ed` },
      data: { name: 'Ed Tsech' }
    })
  })

  it('allows updating', async () => {
    const { update, commit } = batch()
    const id = nanoid()
    const sashaRef = ref(users, `${id}-sasha`)
    const tatiRef = ref(users, `${id}-tati`)
    const edRef = ref(users, `${id}-ed`)
    await Promise.all([
      set(sashaRef, { name: 'Sasha' }),
      set(tatiRef, { name: 'Tati' }),
      set(edRef, { name: 'Ed' })
    ])
    update(sashaRef, { name: 'Sasha Koss' })
    update(tatiRef, { name: 'Tati Shepeleva' })
    update(edRef, { name: 'Ed Tsech' })
    await commit()
    const [sasha, tati, ed] = await Promise.all([
      get(sashaRef),
      get(tatiRef),
      get(edRef)
    ])
    assert(sasha.data.name === 'Sasha Koss')
    assert(tati.data.name === 'Tati Shepeleva')
    assert(ed.data.name === 'Ed Tsech')
  })

  it('allows removing', async () => {
    const { remove, commit } = batch()
    const id = nanoid()
    const sashaRef = ref(users, `${id}-sasha`)
    const tatiRef = ref(users, `${id}-tati`)
    const edRef = ref(users, `${id}-ed`)
    await Promise.all([
      set(sashaRef, { name: 'Sasha' }),
      set(tatiRef, { name: 'Tati' }),
      set(edRef, { name: 'Ed' })
    ])
    remove(sashaRef)
    remove(tatiRef)
    remove(edRef)
    await commit()
    const [sasha, tati, ed] = await Promise.all([
      get(sashaRef),
      get(tatiRef),
      get(edRef)
    ])
    assert(!sasha)
    assert(!tati)
    assert(!ed)
  })
})
