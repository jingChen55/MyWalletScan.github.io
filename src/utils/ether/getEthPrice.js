import { fetchEthPrice } from "../priceUtils";

const getEthPrice = async () => {
    return await fetchEthPrice()
}

export default getEthPrice
