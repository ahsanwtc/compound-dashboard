import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

import Compound from '@compound-finance/compound-js';
import { calculateAPY } from '../apy';

export default function Home({ apys }) {
  const formatPercentage = num => `${new Number(num).toFixed(2)}%`;
  return (
    <div className='container'>
      <Head>
        <title>Compound dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className='row mt-4'>
        <div className='col-sm-12'>
          <div className="jumbotron">
            <h1 className='text-center'>Compound Dashboard</h1>
            <h5 className="display-4 text-center">Shows Compound APYs <br/> with COMP token rewards</h5>
          </div>
        </div>
      </div>

      <table className="table table-hover">
        <thead>
          <tr>
            <td>Ticker</td>
            <td>Supply APY</td>
            <td>COMP APY</td>
            <td>Total APY</td>
          </tr>
        </thead>
        <tbody>
          {apys && apys.map(apy => (
            <tr key={apy.ticker}>
              <td>
                <ul className="list-inline">
                  <li className='list-inline-item'><Image src={`/img/${apy.ticker.toLowerCase()}.png`} width='25' height='25' alt='ticker' /></li>
                  <li className='list-inline-item'>{apy.ticker.toUpperCase()}</li>
                </ul>
              </td>
              <td>{formatPercentage(apy.supplyAPY)}</td>
              <td>{formatPercentage(apy.compoundAPY)}</td>
              <td>{formatPercentage(parseFloat(apy.supplyAPY) + parseFloat(apy.compoundAPY))}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )
};

export async function getServerSideProps(context) {
  const apys = await Promise.all([
    calculateAPY(Compound.cDAI, 'DAI'),
    calculateAPY(Compound.cBAT, 'BAT'),
    calculateAPY(Compound.cUSDT, 'USDT'),
    calculateAPY(Compound.cUSDC, 'USDC'),
  ]);

  return {
    props: {
      apys
    }
  };
}
