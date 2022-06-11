import './App.css';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getParsedNftAccountsByOwner, isValidSolanaAddress, createConnectionConfig, } from "@nfteyez/sol-rayz";
import { Col, Row } from "react-bootstrap";

import { Connection, PublicKey } from '@solana/web3.js';
import {
  Program, Provider, web3, utils, BN
} from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import idl from './idl.json';
import Mynfs from './Mynft';
import Stakenft from './Stakenft';
import Opbar from './Opbar';
const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);
const opts = {
  preflightCommitment: "processed"
}
const programID = new PublicKey(idl.metadata.address);
const auryMintPubkey = new PublicKey('H6c2qLB48STy7GzcCFmDvxdpaQNX5dW8pJxSD2oPoGKg');
const gameQuest = [
  {
    index: 1,
    title: "QUEST 1",
    time: 20,
    kage: 2,
  },
  {
    index: 2,
    title: "QUEST 2",
    time: 100,
    kage: 3,
  },
  {
    index: 3,
    title: "QUEST 3",
    time: 300,
    kage: 4,
  },
];

let provider = [];
let program = [];
let stakingPubkey = [];
let stakingBump = [];
let auryVaultPubkey, auryVaultBump;
let userAuryTokenAccount;
let userStakingCounterPubkey, userStakingCounterBump;
let userStakingIndex = 0;
let userStakingCounter = 0;
let userStakingPubkey, userStakingBump;

function App(props) {
  const wallet = useWallet();
  const { connection } = props;
  
// state change
  useEffect(() => {
    setNfts([]);
    setGroupedNfts([]);
    setShow(false);
     if (wallet) {
        getNfts();
        initialize();
     }
  }, [wallet, connection]);

  const [nfts, setNfts] = useState([]);
  const [groupedNfts, setGroupedNfts] = useState([]);
  //alert props
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);
  //loading props
  const [loading, setLoading] = useState(false);

  const [curQuest, setcurQuest] = useState(gameQuest[0]);
  const [curState, setcurState] = useState('unstake');
  const [remainings, setRemainings] = useState([]);
  const [curtime, setCurtime] = useState(gameQuest[0].time);
  const [curtime1, setCurtime1] = useState(gameQuest[1].time);
  const [curtime2, setCurtime2] = useState(gameQuest[2].time);
  const [clockflag, setClock] = useState(1);
  
  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = "https://metaplex.devnet.rpcpool.com";//https://api.devnet.solana.com
    const connection = new Connection(network, opts.preflightCommitment);

    const provider = new Provider(
      connection, wallet, opts.preflightCommitment,
    );
    return provider;
  }

  function clock(tt) {
    let t = tt - 1;
    if(t > 0) {
      setTimeout(() => {
        setCurtime(t);
        clock(t);
      }, 1000);
    }else{
      setCurtime(0);
      localStorage.setItem(provider.wallet.publicKey.toString()+"1state", "claim");
      if(clockflag === 1) {
        setcurState('claim');
      }
    }
  }

  function clock1(tt) {
    let t = tt - 1;
    if(t > 0) {
      setTimeout(() => {
        setCurtime1(t);
        clock1(t);
      }, 1000);
    }else{
      setCurtime1(0);
      localStorage.setItem(provider.wallet.publicKey.toString()+"2state", "claim");
      if(clockflag === 2) {
        setcurState('claim');
      }
    }
  }

  function clock2(tt) {
    let t = tt - 1;
    if(t > 0) {
      setTimeout(() => {
        setCurtime2(t);
        clock2(t);
      }, 1000);
    }else{
      setCurtime2(0);
      localStorage.setItem(provider.wallet.publicKey.toString()+"3state", "claim");
      if(clockflag === 3) {
        setcurState('claim');
      }
    }
  }

  async function addRemainings(_nft) {
    if(curState !== 'unstake') return;
    let tmp_nft = [];
    for(const _tmp of nfts) {
      if(_tmp.mint !== _nft.mint) {
        tmp_nft.push(_tmp);
      }
    }
    setNfts(tmp_nft);
    let tmp = [];
    for(const _t of remainings) {
      tmp.push(_t);
    }
    const pk = new PublicKey(_nft.mint);
    const [pdaAddress] = await web3.PublicKey.findProgramAddress(
        [
            provider.wallet.publicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            pk.toBuffer(),
        ],
        SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    );
    const [pubkey, bump] = await web3.PublicKey.findProgramAddress(
      [provider.wallet.publicKey.toBuffer(), pk.toBuffer()],
      program.programId
    );
    _nft.pda = pdaAddress;
    _nft.pk = pk;
    _nft.pubkey = pubkey;
    _nft.bump = bump
    tmp.push(_nft);
    setRemainings(tmp);
  }

  async function getNfts() {
    setShow(false);
    let address = wallet.publicKey;
    if (!isValidSolanaAddress(address)) {
      setTitle("Invalid address");
      setMessage("Please enter a valid Solana address or Connect your wallet");
      setLoading(false);
      setShow(true);
      return;
    }

    const connect = createConnectionConfig(connection);

    setLoading(true);
    const nftArray = await getParsedNftAccountsByOwner({
      publicAddress: address,
      connection: connect,
      serialization: true,
    });


    if (nftArray.length === 0) {
      setTitle("No NFTs found in " + props.title);
      setMessage("No NFTs found for address: " + address);
      setLoading(false);
      setShow(true);
      return;
    }

    const metadatas = await fetchMetadata(nftArray);
    var group = {};

    for (const nft of metadatas) {
      if (group.hasOwnProperty(nft.data.symbol)) {
        group[nft.data.symbol].push(nft);
      } else {
        group[nft.data.symbol] = [nft];
      }
    }
    setGroupedNfts(group);
  
    setLoading(false);
    return setNfts(metadatas);
  };

  const fetchMetadata = async (nftArray) => {
    let metadatas = [];
    for (const nft of nftArray) {
      try {
        await fetch(nft.data.uri)
        .then((response) => response.json())
        .then((meta) => { 
          metadatas.push({...meta, ...nft});
        });
      } catch (error) {
        console.log(error);
      }
    }
    return metadatas;
  };

  async function initialize() {
    console.log('init');
    provider = await getProvider();
    console.log("pr:", provider.wallet.publicKey);
    program = new Program(idl, programID, provider);
    console.log('PID:',program.programId.toString());
 
    [stakingPubkey, stakingBump] =
    await web3.PublicKey.findProgramAddress(
      [Buffer.from(utils.bytes.utf8.encode('nft_staking'))],
      program.programId
    );
    console.log('nft_staking:', stakingPubkey.toString(), stakingBump);

    [auryVaultPubkey, auryVaultBump] =
    await web3.PublicKey.findProgramAddress(
      [auryMintPubkey.toBuffer()],
      program.programId
    );

    [userStakingCounterPubkey, userStakingCounterBump] =
    await web3.PublicKey.findProgramAddress(
      [provider.wallet.publicKey.toBuffer()],
      program.programId
    );
    try{
      const curStakeIdx = await program.account.userStakingCounterAccount.fetch(userStakingCounterPubkey);
      userStakingCounter = curStakeIdx.counter;
    }catch{
      console.log('first Stake!!!');
    }
    console.log('USI:', userStakingCounter);
    console.log('USCA:', userStakingCounterPubkey.toString(), userStakingCounterBump);
    [userAuryTokenAccount] = await web3.PublicKey.findProgramAddress(
      [
        provider.wallet.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        auryMintPubkey.toBuffer(),
      ],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    );
    console.log("KageATA:",userAuryTokenAccount.toString());
    let ii = 1;
    for(const cg of gameQuest) {
      let tc = localStorage.getItem(provider.wallet.publicKey.toString()+cg.index+"state");
      if(tc === 'stake') {
        setcurQuest(cg);
        ii = cg.index;
        break;
      }
    }

    changeStakingIndex(ii);
  }

  async function changeStakingIndex(idx) {
    userStakingIndex = userStakingCounter;
    let cstate = localStorage.getItem(provider.wallet.publicKey.toString()+idx+"state");
    if(cstate){
      setcurState(cstate);
    }else{
      setcurState('unstake');
      cstate = 'unstake';
    }
    if(cstate && cstate !== "unstake") {
      userStakingIndex = localStorage.getItem(provider.wallet.publicKey.toString()+idx);
      let rests = localStorage.getItem(provider.wallet.publicKey.toString()+idx+"remain");
      setRemainings(JSON.parse(rests));
      console.log('remains:', rests);
    }else console.log('remains:', remainings);
    console.log('USIndex:', userStakingIndex, userStakingCounter);
    console.log('state:', cstate);
    setcurState(cstate);
    [userStakingPubkey, userStakingBump] =
    await web3.PublicKey.findProgramAddress(
      [
        Buffer.from(
          utils.bytes.utf8.encode(
            new BN(userStakingIndex).toString()
          )
        ),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    console.log('userSA:', userStakingPubkey.toString(), userStakingBump);
  }

  async function changeQuest(idx) {
    setClock(idx);
    getNfts();
    setRemainings([]);
    setcurQuest(gameQuest[idx-1]);
    changeStakingIndex(idx);
    let cs = localStorage.getItem(provider.wallet.publicKey.toString()+idx+"state");
    if(cs === 'lock') {
      // const usInfo = await program.account.userStakingAccount.fetch(userStakingPubkey);
      // const network = "https://metaplex.devnet.rpcpool.com";//https://api.devnet.solana.com
      // const connection = new Connection(network, opts.preflightCommitment);
      // let slot = await connection.getSlot();
      // let blockTime = await connection.getBlockTime(slot);
      // console.log('btime:', blockTime, usInfo.stakingAt.toString(), usInfo.stakingPeriod);
      // let restime = usInfo.stakingPeriod - blockTime - usInfo.stakingAt;
      // console.log('restime', restime);
      // if(restime > 0) {
      //   console.log('lets start!');
      // }
    }else {
      if(idx === 1) setCurtime(gameQuest[idx-1].time);
      if(idx === 2) setCurtime1(gameQuest[idx-1].time);
      if(idx === 3) setCurtime2(gameQuest[idx-1].time);
    }
  }

  async function stake() {
    let remainingAccounts = [];
    let nftVaultBump = [];
    let rests = [];
    for(const tmp of remainings) {
      if(tmp.name === 'addWorrior') {
        break;
      }
      let ra = {
        pubkey: tmp.pk,
        isWritable: false,
        isSigner: false,
      };
      remainingAccounts.push(ra);
      remainingAccounts.push(ra);
      let ra1 = {
        pubkey: tmp.pda,
        isWritable: true,
        isSigner: false,
      };
      remainingAccounts.push(ra1);
      let ra2 = {
        pubkey: tmp.pubkey,
        isWritable: true,
        isSigner: false,
      };
      nftVaultBump.push(tmp.bump);
      remainingAccounts.push(ra2);
      let rest = {
        pda: tmp.pda,
        pubkey: tmp.pubkey,
        image: tmp.image,
        name: tmp.name,
      };
      rests.push(rest);
    }
    let nftVaultBumps = Buffer.from(nftVaultBump);
    if(remainingAccounts.length === 0) return;
    try {
      await program.rpc.stake(
        nftVaultBumps,
        stakingBump,
        userStakingCounterBump,
        userStakingBump,
        {
          accounts: {
            nftFromAuthority: provider.wallet.publicKey,
            stakingAccount: stakingPubkey,
            userStakingCounterAccount: userStakingCounterPubkey,
            userStakingAccount: userStakingPubkey,
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: web3.SYSVAR_RENT_PUBKEY,
          },
          remainingAccounts,
        }
      );
      localStorage.setItem(provider.wallet.publicKey.toString()+curQuest.index, userStakingIndex);
      localStorage.setItem(provider.wallet.publicKey.toString()+curQuest.index+"state", "stake");
      localStorage.setItem(provider.wallet.publicKey.toString()+curQuest.index+"remain", JSON.stringify(rests));  
      setcurState("stake");
    } catch (err) {
      console.log("Transaction error: ", err);
    }
    console.log("Stake");
  }

  async function lockStake() {
    let auryDepositAmount = new BN(1e9);
    auryDepositAmount = auryDepositAmount.mul(new BN(curQuest.kage));
    let userStakingPeriod = new BN(curQuest.time);
    try {
      await program.rpc.lockStake(
        stakingBump,
        userStakingCounterBump,
        userStakingBump,
        auryVaultBump,
        userStakingPeriod,
        auryDepositAmount,
        {
          accounts: {
            nftFromAuthority: provider.wallet.publicKey,
            stakingAccount: stakingPubkey,
            userStakingCounterAccount: userStakingCounterPubkey,
            userStakingAccount: userStakingPubkey,
            auryMint: auryMintPubkey,
            auryVault: auryVaultPubkey,
            auryFrom: userAuryTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
        });
      localStorage.setItem(provider.wallet.publicKey.toString()+curQuest.index+"state", "lock");
      userStakingCounter += 1; 
      setcurState("lock");
      setClock(curQuest.index);
      if(curQuest.index === 1)
        clock(curQuest.time);
      if(curQuest.index === 2)
        clock1(curQuest.time);
      if(curQuest.index === 3)
        clock2(curQuest.time);
    } catch (err) {
      console.log("Transaction error: ", err);
    }
    console.log('lock');
  }

  async function claim() {
    try {
      await program.rpc.claimAuryReward(
        auryVaultBump,
        userStakingIndex,
        userStakingBump,
        {
          accounts: {
            auryMint: auryMintPubkey,
            auryVault: auryVaultPubkey,
            auryTo: userAuryTokenAccount,
            auryToAuthority: provider.wallet.publicKey,
            userStakingAccount: userStakingPubkey,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
        }
      );
      localStorage.setItem(provider.wallet.publicKey.toString()+curQuest.index+"state", "claim");
      setcurState("claim");
    } catch (err) {
      console.log("Transaction error: ", err);
    }
    console.log('claim');
  }

  async function unStake(obj) {
    if(curState === 'unstake') {
      let _nfts = [];
      let _remains = [];
      for(const t of remainings) {
        if(t.pubkey !== obj.pubkey)
          _remains.push(t);
      }
      for(const t of nfts) {
        _nfts.push(t);
      }
      _nfts.push(obj);
      setNfts(_nfts);
      setRemainings(_remains);
    }
    if(curState !== 'claim') return;
    let remainingAccounts = [
      {
        pubkey: new PublicKey(obj.pda),
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: new PublicKey(obj.pubkey),
        isWritable: true,
        isSigner: false,
      },
    ];
    try {
      await program.rpc.unstake(
        stakingBump,
        userStakingIndex,
        userStakingBump,
        {
          accounts: {
            nftToAuthority: provider.wallet.publicKey,
            stakingAccount: stakingPubkey,
            userStakingAccount: userStakingPubkey,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
          remainingAccounts,
        }
      );
      let rem = [];
      for(const rm of remainings){
        if(rm.pubkey !== obj.pubkey) {
          rem.push(rm);
        }
      }
      if(rem.length === 0){
        localStorage.setItem(provider.wallet.publicKey.toString()+curQuest.index+"state", "unstake");
        setcurState('unstake');
        if(curQuest.index === 1) setCurtime(curQuest.time);
        if(curQuest.index === 2) setCurtime1(curQuest.time);
        if(curQuest.index === 3) setCurtime2(curQuest.time);
      }
      setRemainings(rem);
      localStorage.setItem(provider.wallet.publicKey.toString()+curQuest.index+"remain", JSON.stringify(rem));
      getNfts();
    } catch (err) {
      console.log("Transaction error: ", err);
    }
    console.log('unstake');
  }

  return (
    <div className="main">
      <Row className="inputForm">
        <Col lg="10">Here are your NFTs. *Please do select devnet.*</Col>
        <Col lg="2">
        </Col>
      </Row>
      <Mynfs 
        loading={loading}
        title={title}
        message={message}
        setShow={setShow}
        nfts={nfts}
        show={show}
        addRemainings={addRemainings}
      />
      <Row className="inputForm">
        <Col lg="10">Here is your squad. *You can select above NFTs to make a squad.*</Col>
        <Col lg="2">
        </Col>
      </Row>
      <Stakenft
        loading={loading}
        remainings={remainings}
        unStake={unStake}
      />
      <Opbar 
        stake={stake}
        lockStake={lockStake}
        claim={claim}
        changeQuest={changeQuest}
        curQuest={curQuest}
        curtime={curtime}
        curtime1={curtime1}
        curtime2={curtime2}
        clockflag={clockflag}
        curState={curState}
      />
    </div>
  );
}

export default App;
