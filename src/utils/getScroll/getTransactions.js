import axios from "axios";

const KeyList = [
    "CIHU5N8Q1HUMSAY4XNHKAPHDZACMRUMEJA",
    "DUH9Y5D1RBUVK9W1HAW23G1N3HSW3P99D7",
    "UW1KY5XD5B5NAMUADHI9K5DMKNSBMBQQ41",
    "A6KWQP41MURYX7EHE3S645TYA2VSDB51UV",
    "VYUV9Q164QC9K42KFNT1ER5WK7T8TSJBEP",
    "FPYTQ3PVMBVK764FRZD47QI47HAF4URJ6H"
]
const getTransactions = async ( address ) => {
    const key = KeyList[ Math.floor( Math.random() * KeyList.length ) ]
    const url = `https://api.scrollscan.com/api?module=account&action=txlist&startblock=0&sort=asc&address=${ address }&apikey=${ key }`
    const response = await axios.get( url );
    return response.data.result;
}
export default getTransactions;
