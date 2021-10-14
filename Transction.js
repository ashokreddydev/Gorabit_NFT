const axios = require('axios');
const url = 'https://api-testnet.bscscan.com/api?module=account&action=txlistinternal&txhash=@hash&apikey=GBBNZ28QERQ8WABZ7ACJIU68VZUJKFXIEU'

const load = async (query) => {
const { data:bitQuery } = await axios.post('https://graphql.bitquery.io',{'query': query})
const { ethereum : {smartContractEvents}} =  bitQuery.data;
const data = smartContractEvents.filter(x=>x.eventIndex === '2').map(x=>{
    return {
        block: x.block,
        hash: x.transaction.hash,
        from:x.arguments.find(a=>a.argument.includes('_from')).value,
        to:x.arguments.find(a=>a.argument.includes('_to')).value,
        databaseID:x.arguments.find(a=>a.argument.includes('_id')).value,
        qty:x.arguments.find(a=>a.argument.includes('_value')).value,
        value:0
    }
}).filter(nft=>Number(nft.databaseID) === 5)
let getPrices = [];
data.forEach(x=>{
    getPrices.push(axios.get(url.replace('@hash',x.hash)))
})
const pricesList = await (await Promise.all(getPrices)).map((x,index)=>{
    const { data :{status,message,result} } = x;
    let price = 0 ;
    if(status === '1' && message === 'OK')
    {
        price = (result.reduce((p,{value})=> p+Number(value),0))/1e18
    }
    data[index].value = price;
    return {status,message,result}
})
console.log(JSON.stringify(data))
}
let q =`{
    ethereum(network: bsc_testnet) {
      smartContractEvents(
        options: {}
        smartContractAddress: {is: "0xa21a105f1ae4feC68A0f8b34277eb905095FDd58"}
        txHash: {}
      ) {
        block {
          height
          timestamp {
            unixtime
          }
        }
        transaction {
          hash
        }
        eventIndex
        arguments {
          value
          argument
          index
          argumentType
        }
        smartContractEvent {
          name
          signature
          signatureHash
        }
        date {
          date
        }
      }
    }
  }`
load(q);
