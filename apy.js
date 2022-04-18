import Compound from "@compound-finance/compound-js";
import settings from './settings.json';

const provider = settings.infura;
const comptroller = Compound.util.getAddress(Compound.Comptroller);
const oraclePriceFeed = Compound.util.getAddress(Compound.PriceFeed);

