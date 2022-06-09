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
    time: 10,
    kage: 2,
  },
  {
    index: 2,
    title: "QUEST 2",
    time: 15,
    kage: 3,
  },
  {
    index: 3,
    title: "QUEST 3",
    time: 19,
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
        clock(t);
      }, 1000);
    }else{
      localStorage.setItem(provider.wallet.publicKey.toString()+"1state", "claim");
      if(curQuest.index === 1) {
        setcurState('claim');
      }
    }
    if(curQuest.index === 1) {
      setCurtime(t);
    }
  }

  function clock1(tt) {
    let t = tt - 1;
    if(t > 0) {
      setTimeout(() => {
        clock1(t);
      }, 1000);
    }else{
      localStorage.setItem(provider.wallet.publicKey.toString()+"2state", "claim");
      if(curQuest.index === 2) {
        setcurState('claim');
      }
    }
    if(curQuest.index === 2) {
      setCurtime(t);
    }
  }

  function clock2(tt) {
    let t = tt - 1;
    if(t > 0) {
      setTimeout(() => {
        clock2(t);
      }, 1000);
    }else{
      localStorage.setItem(provider.wallet.publicKey.toString()+"3state", "claim");
      if(curQuest.index === 3) {
        setcurState('claim');
      }
    }
    if(curQuest.index === 3) {
      setCurtime(t);
    }
  }

  async function addRemainings(_nft) {
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

    changeStakingIndex(1);
  }

  async function changeStakingIndex(idx) {
    const curStakeIdx = 
        await program.account.userStakingCounterAccount.fetch(userStakingCounterPubkey);
    if(curStakeIdx.counter > 0) {
      userStakingIndex = curStakeIdx.counter;
    }        
    console.log("sugIdx:", curStakeIdx.counter);
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
    console.log('USIndex:', userStakingIndex);
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

  function changeQuest(idx) {
    getNfts();
    setRemainings([]);
    setcurQuest(gameQuest[idx-1]);
    changeStakingIndex(idx);
    if(curState === 'lock') {

    }else {
      setCurtime(gameQuest[idx-1].time);
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
      setcurState("lock");
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
      }
      setRemainings(rem);
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
          <button onClick={initialize}>init</button>
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
        curState={curState}
      />
    </div>
  );
}

export default App;
