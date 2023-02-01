# linkfeed record
record operations 
## Installation

```sh
npm install linkfeed-record
```

## Example
How to create a record class? 
```ts
import  Record  from 'linkfeed/record'
// the ceramic is optional, if not be set, we would use Testnet node 
const rec = new Record({did: did, ceramic: ceramic})
// first, we should anthenticate the did
await rec.auth()
```
We can use the record to collect an item
```ts
// we can create a item by create function 
// we will generate a uuid if the uuid is not set.
// Notice : not only the three feild can be provided, you can set any feild into the item
const item = {"title":"my title","source_url":"my url", "uuid": uuid}
await rec.create(item)
```
To get all the item we collected, we can use the list function
```ts
// show the list we collect, a array will be returned
const list = rec.list()
```
We also can remove an item, or update an item like below
```ts
// remove by uid, the uid can be found in the results of the list function
await rec.remove(uid)
// update an item, uid can be found by the same way 
// we change the item to be newItem by uid
const newItem = {"title":"new title","source_url":"new url"}
await rec.update(newItem, uid)
```
## prerequisite
In order to create a record instance, we need a Ceramic instance and an DID.
### Ceramic instance
If you have run a local node, you can get a ceramic instance like this 
```ts
import { CeramicClient } from '@ceramicnetwork/http-client'
// the node port is 7007 by default, you must set it to be right if you have changed on the local node
const ceramic = new CeramicClient('http://localhost:7007')
```
Or, you can get a ceramic instance from the Clay Testnet
```ts
import { CeramicClient } from '@ceramicnetwork/http-client'
const ceramic = new CeramicClient("https://ceramic-clay.3boxlabs.com")
```
### DID
If you are developing an App and you have to connect a blockchain wallet, maybe the 3ID Connect is what you want.

3ID Connect is an in-browser 3ID DID provider, using blockchain wallets to create deterministic authentication secrets using to control a DID.

Using 3ID Connect, web apps do not need to take care of key custody directly, but rather to use an authentication provider such as EthereumAuthProvider to allow 3ID Connect to generate the necessarry authentication secrets.
#### installation
```sh
npm install @3id/connect
```
#### Usage
```ts
import { CeramicClient } from '@ceramicnetwork/http-client'
import { DID } from 'dids'
import { getResolver as getKeyResolver } from 'key-did-resolver'
import { getResolver as get3IDResolver } from '@ceramicnetwork/3id-did-resolver'
import { EthereumAuthProvider, ThreeIdConnect } from '@3id/connect'

// Create a ThreeIdConnect connect instance as soon as possible in your app to start loading assets
const threeID = new ThreeIdConnect()

async function getDidWithEthereum(ethereumProvider) {
  // Request accounts from the Ethereum provider
  const accounts = await ethereumProvider.request({
    method: 'eth_requestAccounts',
  })
  // Create an EthereumAuthProvider using the Ethereum provider and requested account
  const authProvider = new EthereumAuthProvider(ethereumProvider, accounts[0])
  // Connect the created EthereumAuthProvider to the 3ID Connect instance so it can be used to
  // generate the authentication secret
  await threeID.connect(authProvider)

  const did = new DID({
    // Get the DID provider from the 3ID Connect instance
    provider: threeID.getDidProvider(),
    resolver: {
      ...get3IDResolver(ceramic),
      ...getKeyResolver(),
    },
  })

  return did
}
// When using extensions such as MetaMask, an Ethereum provider may be injected as `window.ethereum`
if (window.ethereum == null) {
    throw new Error('No injected Ethereum provider')
}
const did = await getDidWithEthereum(window.ethereum)
```
## Maintainers

- dugubuyan ([@dugubuyan](https://github.com/dugubuyan))

