import { Ed25519Provider } from 'key-did-provider-ed25519'
import KeyDidResolver from 'key-did-resolver'
import { randomBytes } from '@stablelib/random'
import { DID } from 'dids'

export async function createDIDKey(seed?: Uint8Array): Promise<DID> {
    const didProvider = new Ed25519Provider(seed || randomBytes(32))
    const didKey = new DID({
        provider: didProvider,
        resolver: KeyDidResolver.getResolver(),
    })
    console.log(didKey.id.toString())
    return didKey
}

/**
 * @module did
 */
export default　class Did {
    async create():Promise<DID>{
        return createDIDKey().then(key => {
            console.log(key.id.toString())
            return key
        })
    }
}