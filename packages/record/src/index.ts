import { CeramicClient } from '@ceramicnetwork/http-client'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { DID } from 'dids'
import { DataModel } from '@glazed/datamodel'
import { DIDDataStore } from '@glazed/did-datastore'
import {v4 as uuidv4} from 'uuid'
const modelAliases = {"definitions":{"collect":"kjzl6cwe1jw147yeaalxixzvq5jovo5820ri7fukrb1tg0l8xacjg6o9vch3cvx","users":"kjzl6cwe1jw145wzthep9fmjozm41iv1a4j5zsfnbagonnu9xrrz7n2m0oc61nd"},"schemas":{"record":"ceramic://k3y52l7qbv1fry9coozhzdyrjzojkrraxp9r2o95x8ase64e0ax76hgsh9ks9g5j4","standard":"ceramic://k3y52l7qbv1fryqurr08i8t5x9ifqwt5fea9lpg0kerr0xsmpots20d8tbode3t34"},"tiles":{}}

export type RecordParams = {
    /**
     * A Ceramic client instance
     */
    ceramic?: CeramicClient
    /**
     * A {@linkcode DID} instance to use,
     */
    did?: DID
}
/**
 * this schema is defined in linkfeed data model
 * this schema is like below:
 * ```
 * {"$schema":"http://json-schema.org/draft-07/schema#","title":"chainfdFeed","type":"object","properties":{"title":{"type":"string","title":"title"},"abstract":{"type":"string","title":"abstract"},"author_name":{"type":"string","title":"abstract"},"source_url":{"type":"string","title":"source_url","maxLength":1024},"show_time":{"type":"string","title":"show_time"},"uuid":{"type":"string","title":"uuid","maxLength":120}},"required":["uuid","title","source_url"]}
 * ```
 * recordSchemaId is the id of the schema
 */
const recordSchemaId='k3y52l7qbv1fry9coozhzdyrjzojkrraxp9r2o95x8ase64e0ax76hgsh9ks9g5j4'
/**
 * @module record
 */
export default class Record {
    #ceramic: CeramicClient
    #did?: DID
    #model: DataModel<any>
    #store : DIDDataStore
    constructor(params: RecordParams) {
        if (params.ceramic == null) {
            this.#ceramic = new CeramicClient("https://ceramic-clay.3boxlabs.com")
        }else{
            this.#ceramic = params.ceramic
        }
        this.#did = params.did
    }

    /**
     * make did an authenticated one
     * simultaneously, initialized the instances of data model and the did store
     */
    async auth(name?:string):Promise<void>  {
        await this.#did.authenticate()
        // The Ceramic client can create and update streams using the authenticated DID
        this.#ceramic.did = this.#did
        console.log(this.#did)
        // Create the model and store
        const ceramic = this.#ceramic
        this.#model = new DataModel({ ceramic, aliases: modelAliases })
        const model = this.#model
        this.#store = new DIDDataStore({ ceramic, model })
    }

    /**
     * registered the user into user table
     * the user table is recorded in the data model which stored in the local node
     * TDO: use data model manager instead of data model
     * @param name

    async register(name?:string):Promise<void> {
        const model =  this.#model
        // register the linker
        if(name == null){
            name = "linker"
        }
        const didKey = this.#did.id.toString()
        const content = {}
        content[didKey] = name
        await model.createTile('standard', content)
    }*/

    /**
     * store a record, and then make it trackable in the record table
     * @param item
     */
    async create(item:any) : Promise<void> {
        // // Create the model and store
        const ceramic = this.#ceramic
        // const model = new DataModel({ ceramic, aliases: modelAliases })
        // const store = new DIDDataStore({ ceramic, model })
        const store = this.#store
        if(item.uuid == null){
            item.uuid = uuidv4()
        }
        console.log("the content of the record: ", item)
        // The following call will fail if the Ceramic instance does not have an authenticated DID
        const doc = await TileDocument.create(ceramic, item, { schema: recordSchemaId })
        // The stream ID of the created document can then be accessed as the `id` property
        console.log("record is successfully created,the id is " , doc.id.toString())
        const content = {}
        // content.set(item.uuid, doc.id.toString())
        // console.log(content.toString())
        content[item.uuid] = doc.id.toString()
        await store.merge('collect', content)
        const repos = await store.get('collect')
        console.log("now , the collect table is :" , repos)
    }

    /**
     * update a document by uuid
     * actually, we update a document by a stream id , so we get the stream id first
     * we use the function getStreamIdByUuid to get the stream id
     * @param item
     * @param uuid
     */
    async update(item:any, uuid:string) : Promise<void> {
        const ceramic = this.#ceramic
        const docId = await this.getStreamIdByUuid(uuid)
        const doc =  await TileDocument.load(ceramic, docId)
        // The following call will fail if the Ceramic instance does not have an authenticated DID
        console.log("updated stream id :", docId)
        await doc.update(item)
        const updated = await TileDocument.load(ceramic, docId)
        console.log("updated doc:", updated.content)
    }

    /**
     * we define this function is used by update function
     * but , you can also use this function if you want to know how the ceramic do this
     * sometimes, if you want to check the document by third tools like "cerscan", this function is needed
     * @param uuid
     */
    async getStreamIdByUuid(uuid:string) :Promise<string> {
        const ceramic = this.#ceramic
        const store = this.#store
        const repos = await store.get('collect')
        return repos[uuid]
    }

    /**
     * list all the record you have collected
     */
    async list():Promise<any>  {
        const ceramic = this.#ceramic
        const store = this.#store
        const records = []
        try {
            const repos = await store.get('collect')
            for(const name in repos) {
                const streamId = repos[name]
                console.log(streamId)
                const doc =  await TileDocument.load(ceramic, streamId)
                records.push(doc.content)
            }
            return records
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * remove one record by its uuid
     * once removed , the record is not in the collect list
     * but the stream itself is not removed from ceramic
     * @param uuid
     */
    async remove(uuid:string) : Promise<void> {
        try{
            const repos = await this.#store.get('collect')
            if(repos == null || repos[uuid] == null){
                console.log("no record found")
                return
            }
            // repos.delete(uuid)
            Reflect.deleteProperty(repos , uuid);
            await this.#store.set('collect', repos)
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}