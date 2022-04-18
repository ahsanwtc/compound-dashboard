import Compound from "@compound-finance/compound-js";
import settings from './settings.json';

const provider = settings.infura;
const comptroller = Compound.util.getAddress(Compound.Comptroller);
const oraclePriceFeed = Compound.util.getAddress(Compound.PriceFeed);

const cTokenDecimals = 8;
const blocksPerDay = 4 * 60 * 24; // 4 blocks in 1 minute
const daysPerYear = 365;
const blocksPerYear = blocksPerDay * daysPerYear;
const ethMantissa = Math.pow(10, 18); // 1 * 10 ^ 18


const calculateSupplyAPY = async cToken => {
  /* get supply rate per block */
  const supplyRatePerBlock = await Compound.eth.read(
    cToken,
    'function supplyRatePerBlock() returns(uint)',
    [],
    {provider}
  );
  
  /* supply rate = (1 + block_rate) ^ blocks_per_year */
  /* divide the supplyRatePerBlock by ehtMantissa because it is scaled by 10^18 */
  /* number of days for interest is always 1 less than the period e.g  if you compound you interest for 3 days */
  /* it's actually 2 days, so for a year it'll be daysPerYear - 1  */
  
  const ratePerDay = supplyRatePerBlock / ethMantissa * blocksPerDay;
  const sum = Math.pow(ratePerDay + 1, daysPerYear - 1);

  /* only need the decimal part, so subtract 1 and transform it into percentage by multiplying with 100*/
  return 100 * (sum - 1);
};

/**
 * 
 * @param {address} cToken Address of the cToken
 * @param {string} ticker Ticker of the underlying asset e.g DAI, BAT etc
 * @param {integer} underlyingAssetDecimals Decimals of the underlying asset e.g 18 for DAI
 */
const calculateCompAPY = async (cToken, ticker, underlyingAssetDecimals) => {
  /* amount of COMP tokens given to either lenders or borrowers for this market for the current block */
  /* as part of the liquidity mining program */
  let compSpeed = await Compound.eth.read(
    comptroller,
    'function compSpeeds(address cToken) public returns (uint)',
    [cToken],
    {provider}
  );

  let compPrice = await Compound.eth.read(
    oraclePriceFeed,
    'function price(string memory symbol) external view returns (uint)',
    [Compound.COMP],
    {provider}
  );

  /* price of the underlying token, e.g if cToken is cDAI, then underlying token is DAI */
  let underlyingPrice = await Compound.eth.read(
    oraclePriceFeed,
    'function price(string memory symbol) external view returns (uint)',
    [ticker],
    {provider}
  );

  let totalSupply = await Compound.eth.read(
    cToken,
    'function totalSupply() returns (uint)',
    [],
    {provider}
  );

  /* exchange rate of cToken and underlying asset */
  let exchangeRate = await Compound.eth.read(
    cToken,
    'function exchangeRateCurrent() returns (uint)',
    [],
    {provider}
  );

  /* compToken has 18 decimals, so to get the number of tokens divide by 1e18  or ethMantissa */
  compSpeed = compSpeed / 1e18;

  /* price feed is USD and returned with a precision of 6 decimal palces */
  compPrice = compPrice / 1e6;
  underlyingPrice = underlyingPrice / 1e6;

  /* The current exchange rate as an unsigned integer, scaled by 1 * 10^(18 - 8 + Underlying Token Decimals). */
  exchangeRate = +exchangeRate.toString() / ethMantissa;
  
  /* totalSupply is in term of cTokens, need totalSupply in terms of USD */
  /* first convert from cTokens to underlying asset and then to a USD value */
  /* divide the capInUSD by token precision bcause totalSupply is returned in underlyingAssetDecimals precision */
  const amountOfUnderlyingTokens = +totalSupply.toString() * exchangeRate;
  const capInUSD = amountOfUnderlyingTokens * underlyingPrice;
  totalSupply = capInUSD / Math.pow(10, underlyingAssetDecimals);

  const compPerDay = compSpeed * blocksPerDay;

  /* compToken price in USD which all the lenders/borrowers received in one day */
  const compTokenUSDOneDay = compPrice * compPerDay / totalSupply;
  
  /* compToken has no compounding effect, next block reward is not dependent on previous blocks */  
  const compTokenUSDInYear = compTokenUSDOneDay * daysPerYear;

  /* return percentage */
  return 100 * compTokenUSDInYear;
};