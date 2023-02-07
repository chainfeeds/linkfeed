import { Ed25519Provider } from 'key-did-provider-ed25519'
import KeyDidResolver from "key-did-resolver"
import { randomBytes } from '@stablelib/random'
import { DID } from 'dids'
import { CeramicClient } from '@ceramicnetwork/http-client'
import Record from "../../lib/index.js";

    const didProvider = new Ed25519Provider(randomBytes(32))
    const didKey = new DID({
        provider: didProvider,
        resolver: KeyDidResolver.getResolver(),
    })
// await didKey.authenticate()
// console.log(didKey.id.toString())
const ceramic = new CeramicClient('http://localhost:7007')
const params = {did:didKey, ceramic: ceramic}

async function　newRecord(){
    const rec = new Record(params)
    await rec.auth("user1")
    return rec
}
async function createItem(rec){
    let item = {"title":"my title555","source_url":"url","tags":["",""]}
    await rec.create(item)
    item = {"title":"my title666","source_url":"url"}
    await rec.create(item)
}

newRecord().then(rec=>{
    createItem(rec).then(()=>{
        rec.list().then(res => {
            console.log(res)
            if(res.length > 1){
                const uuid = res[1].uuid
                const item = {"title":"my title111","source_url":"url1111","uuid":uuid}
                rec.update(item, uuid).then(()=>{
                    console.log("update success: ", uuid)
                    const uid = res[0].uuid
                    console.log("remove uuid:" , uid)
                    rec.remove(uid).then(()=>{
                        rec.list().then(res1 => {
                            console.log(res1)
                        })
                    })
                })
            }
        })
    })
})
// createItem(rec)