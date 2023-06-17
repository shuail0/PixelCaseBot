const { Wallet, Provider } = require('zksync-web3');
// const zksync = require('zksync-web3');
const ethers = require('ethers');
const { defaultAbiCoder } = require('ethers').utils;
const { BigNumber } = require('ethers');
const { approveToken } = require('./erc20utils');
const fs = require('fs');
const { convertCSVToObjectSync, sleep, getRandomFloat, saveLog } = require('./utils');
const { count } = require('console');


// ------------主网网配置-----------
// 配置RPC

const zksrpc = 'https://mainnet.era.zksync.io';
const ethereumrpc = 'https://eth-mainnet.g.alchemy.com/v2/qRnk4QbaEmXJEs5DMnhitC0dSow-qATl';
const provider = new Provider(zksrpc);
const ethereumProvider = new ethers.getDefaultProvider(ethereumrpc);

const nftABI = JSON.parse(fs.readFileSync('./ABI/PixelCollectorNft.json'));
const nftContractAddress = '0x1ec43b024A1C8D084BcfEB2c0548b6661C528dfA';



// 设定项目名称，保存日志用
const projectName = 'PixelCollectorNft';
// 设定最大GAS，主网GAS高于这个值程序不执行
const maxGasPrice = 30;
// 设定随机交易金额比例 
const minAmountPct = 0.2;
const maxAmountPct = 0.3;

// 设定账户随机间隔时间区间
const minSleepTime = 1;
const maxSleepTime = 5;

// 设置钱包文件路径
const walletPath = './data/walletData.csv';



// 程序开始运行
console.log('正在打开钱包文件...')
//  打开地址文件
const walletData = convertCSVToObjectSync(walletPath);

async function main() {
    
    console.log('开始循环...')
    for(wt of walletData){

        // 循环获取GAS
        while (true) {
            console.log('开始获取当前主网GAS');
            const gasPrice = parseFloat(ethers.utils.formatUnits(await ethereumProvider.getGasPrice(), 'gwei'));
            console.log(`当前gasPrice：${gasPrice}`);
            if (gasPrice > maxGasPrice) {
                console.log(`gasPrice高于设定的最大值${maxGasPrice}，程序暂停30分钟`)
                await sleep(30);
            } else {
                console.log(`gasPrice低于${maxGasPrice}，程序继续执行`) 
                break;
            };
        }
        
        console.log(`帐号：${wt.Wallet}, 地址：${wt.Address}， 开始执行交易...`);
        // 创建钱包
        const wallet = new Wallet(wt.PrivateKey).connect(provider).connectToL1(ethereumProvider);
        // 开始mint
        // 创建智能合约
        console.log('开始mint')
        const nftContract = new ethers.Contract(nftContractAddress, nftABI, wallet);
        // Mint
        const txMint = await nftContract.mint();
        console.log(await txMint.wait());

        // 保存日志
        const currentTime = new Date().toISOString();
        const logMessage = `成功执行 - 时间: ${currentTime}, 钱包名称: ${wt.Wallet},钱包地址: ${wallet.address}`;
        saveLog(projectName, logMessage);
        // 暂停
        const sleepTime = getRandomFloat(minSleepTime, maxSleepTime).toFixed(1); 
        console.log(logMessage, '程序暂停',sleepTime,'分钟后继续执行');
        await sleep(sleepTime);

    }

}

main()
