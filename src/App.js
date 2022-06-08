import './App.css';
import { useEffect, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getParsedNftAccountsByOwner, isValidSolanaAddress, createConnectionConfig, } from "@nfteyez/sol-rayz";
import { Col, Row, Button, Form, Card, Badge, FormControl } from "react-bootstrap";
import AlertDismissible from './alert/alertDismissible';

import { Connection, PublicKey } from '@solana/web3.js';
import {
  Program, Provider, web3, utils, BN
} from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import idl from './idl.json';
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
let userStakingIndex = 0;
let program = [];
let stakingPubkey = [];
let stakingBump = [];
let auryVaultPubkey, auryVaultBump;
let userStakingCounterPubkey, userStakingCounterBump;
let userStakingPubkey, userStakingBump;
let userAuryTokenAccount;
let idx = 0;

function App(props) {
  const { publicKey } = useWallet();
  const { connection } = props;
  const wallet = useWallet();
  const [curQuest, setcurQuest] = useState(gameQuest[0]);

  // state change
  useEffect(() => {
    setNfts([]);
    setView("nft-grid");
    setGroupedNfts([]);
    setShow(false);
     if (publicKey) {
       initRemainings();
       getNfts();
       initialize();
     }
  }, [publicKey, connection, curQuest]);

  const [nfts, setNfts] = useState([]);
  const [groupedNfts, setGroupedNfts] = useState([]);
  const [view, setView] = useState('collection');
  //alert props
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);

  //loading props
  const [loading, setLoading] = useState(false);

  const [curState, setcurState] = useState('unstake');
  const [remainings, setRemainings] = useState([]);
  const [provider, setProvider] = useState([]);
  const [timer, setCounter] = useState(0);
  const [timer1, setCounter1] = useState(0);
  const [timer2, setCounter2] = useState(0);
  
  // const getNfts = async (e) => {
  //   e.preventDefault();
  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = "https://api.devnet.solana.com";
    const connection = new Connection(network, opts.preflightCommitment);

    const provider = new Provider(
      connection, wallet, opts.preflightCommitment,
    );
    return provider;
  }

  function clock(tt) {
    let t = tt - 1;
    console.log('tt:', t);
    if(t > 0) {
      setCounter(t);
      setTimeout(() => {
        clock(t);
      }, 3000);
    }else{
      setCounter(0);
      localStorage.setItem(provider.wallet.publicKey.toString()+gameQuest[0].index+"state", "claim");
      setcurState('claim');
    }
  }

  function clock1(tt) {
    let t = tt - 1;
    console.log('tt:', t);
    if(t > 0) {
      setCounter1(t);
      setTimeout(() => {
        clock1(t);
      }, 3000);
    }else{
      setCounter1(0);
      localStorage.setItem(provider.wallet.publicKey.toString()+gameQuest[1].index+"state", "claim");
      setcurState('claim');
    }
  }
  function clock2(tt) {
    let t = tt - 1;
    console.log('tt:', t);
    if(t > 0) {
      setCounter2(t);
      setTimeout(() => {
        clock2(t);
      }, 3000);
    }else{
      setCounter2(0);
      localStorage.setItem(provider.wallet.publicKey.toString()+gameQuest[2].index+"state", "claim");
      setcurState('claim');
    }
  }

  async function prevQuest() {
    if(idx > 0)
      idx--;
    setcurQuest(gameQuest[idx]);
  }

  async function nextQuest() {
    if(idx < 2)
      idx++;
    setcurQuest(gameQuest[idx]);
  }

  async function initialize() {
    let pro = await getProvider();
    setProvider(pro);
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

    const curStakeIdx = 
        await program.account.userStakingCounterAccount.fetch(userStakingCounterPubkey);
    if(curStakeIdx.counter > 0) {
      userStakingIndex = curStakeIdx.counter;
    }        
    console.log("sugIdx:", curStakeIdx.counter);
    let cstate = localStorage.getItem(provider.wallet.publicKey.toString()+curQuest.index+"state");
    if(cstate){
      setcurState(cstate);
    }else{
      setcurState('unstake');
      cstate = 'unstake';
    }
    if(cstate && cstate != "unstake") {
      userStakingIndex = localStorage.getItem(provider.wallet.publicKey.toString()+curQuest.index);
      let rests = localStorage.getItem(provider.wallet.publicKey.toString()+curQuest.index+"remain");
      setRemainings(JSON.parse(rests));
    }
    console.log('USIndex:', userStakingIndex);
    console.log('remains:', remainings);
    console.log('state:', cstate);
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
    [userAuryTokenAccount] = await web3.PublicKey.findProgramAddress(
      [
        provider.wallet.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        auryMintPubkey.toBuffer(),
      ],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    );
    console.log("KageATA:",userAuryTokenAccount.toString());
    let ti = gameQuest[idx].time;
    if(idx === 0 && curState === 'unstake')
      setCounter(ti);
    if(idx === 1 && curState === 'unstake')
      setCounter1(ti);
    if(idx === 2 && curState === 'unstake')
      setCounter2(ti);
          
  }

  async function prepareRemains() {
    const usdata = await program.account.userStakingAccount.fetch(userStakingPubkey);
    console.log(usdata, usdata.nftMintKeys[0].toString(),usdata.nftMintKeys);
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
    if(remainingAccounts.length == 0) return;
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
    // localStorage.setItem(provider.wallet.publicKey.toString()+curQuest.index, userStakingIndex);
    // localStorage.setItem(provider.wallet.publicKey.toString()+curQuest.index+"state", "stake"); 
    // localStorage.setItem(provider.wallet.publicKey.toString()+curQuest.index+"remain", JSON.stringify(rests)); 
    // setcurState("stake");
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
      if(curQuest.index == 1)
        clock(timer);
      if(curQuest.index == 2)
        clock1(timer1);
      if(curQuest.index == 3)
        clock2(timer2);
    } catch (err) {
      console.log("Transaction error: ", err);
    }
    // localStorage.setItem(provider.wallet.publicKey.toString()+curQuest.index+"state", "lock");
    // setcurState("lock");
    // if(curQuest.index == 1)
    //   clock(timer);
    // if(curQuest.index == 2)
    //   clock1(timer1);
    // if(curQuest.index == 3)
    //   clock2(timer2);
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
    // localStorage.setItem(provider.wallet.publicKey.toString()+curQuest.index+"state", "claim");
    // setcurState("claim");
    console.log('claim');
  }

  async function unStake(obj) {
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
      localStorage.setItem(provider.wallet.publicKey.toString()+curQuest.index+"state", "unstake");
      setcurState("unstake");
    } catch (err) {
      console.log("Transaction error: ", err);
    }

    // localStorage.setItem(provider.wallet.publicKey.toString()+curQuest.index+"state", "unstake");
    // setcurState("unstake");
    console.log('unstake');
  }

  async function addRemainings(_nft) {
    let tmp = [];
    let flag = true;
    for(const r of remainings) {
      if(r.name === "addWorrior" && flag) {
        const pk = new PublicKey(_nft.mint);
        _nft.pk = pk;
        const [pdaAddress] = await web3.PublicKey.findProgramAddress(
            [
                provider.wallet.publicKey.toBuffer(),
                TOKEN_PROGRAM_ID.toBuffer(),
                pk.toBuffer(),
            ],
            SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        );
        _nft.pda = pdaAddress;
        const [pubkey, bump] = await web3.PublicKey.findProgramAddress(
          [provider.wallet.publicKey.toBuffer(), pk.toBuffer()],
          program.programId
        );
        _nft.pubkey = pubkey;
        _nft.bump = bump
        tmp.push(_nft);
        flag = false;
      }else {
        tmp.push(r)
      }  
    }
    setRemainings(tmp);
  }

  async function initRemainings() {
    let tmp = [];
    for(let i = 0; i < 4; i++) {
      let t = [];
      t.image = './plus.png';
      t.name = 'addWorrior';
      tmp.push(t);
    }
    setRemainings(tmp);
  }

  async function getNfts() {
    setShow(false);
    let address = publicKey;
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
      setView('collection');
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

  return (
    <div className="main">
      <Row className="inputForm">
        <Col lg="10">Here are your NFTs. *Please do select devnet.*</Col>
        <Col lg="2">
        </Col>
      </Row>
      
      {
        <Row className='h-64 border-2 rounded-xl border-black'>
          {loading && (
            <div className="loading">
              <img src="" alt="loading..." className='' />
            </div>
          )}
          {show && (
            <AlertDismissible title={title} message={message} setShow={setShow} />
          )}

          {!loading &&
            view === "nft-grid" &&
            nfts.map((metadata, index) => (
              <Col xs="12" md="6" lg="2" key={index}>
                <Card
                  onClick={() => {
                    addRemainings(nfts[index]);
                  }}
                  className="imageGrid"
                  lg="3"
                  style={{
                    width: "100%",
                    backgroundColor: "#2B3964",
                    padding: "10px",
                    borderRadius: "10px",
                  }}
                >
                  <Card.Img
                    variant="top"
                    src={metadata?.image}
                    alt={metadata?.name}
                  />
                  <Card.Body>
                    <Card.Title style={{ color: "#fff" }}>
                      {metadata?.name}
                    </Card.Title>
                  </Card.Body>
                </Card>
              </Col>
            ))}
        </Row>
      }
      <Row className="inputForm">
        <Col lg="10">Here is your squad. *You can select above NFTs to make a squad.*</Col>
        <Col lg="2">
        </Col>
      </Row>
      <Row className='h-64 border-2 rounded-xl border-black'>
        <Col xs="12" md="6" lg="2">
          <Card
            onClick={() => {
              if(curState === 'claim' && remainings[0] && remainings[0].name && remainings[0].name != 'addWorrior')
                unStake(remainings[0]);
            }}
            className="imageGrid"
            lg="3"
            style={{
              width: "100%",
              backgroundColor: "#2B3964",
              padding: "10px",
              borderRadius: "10px",
            }}
          >
            <Card.Img
              variant="top"
              src={remainings[0]?.image}
              alt={remainings[0]?.name}
            />
            <Card.Body>
              <Card.Title style={{ color: "#fff" }}>
                {remainings[0]?.name}
              </Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col xs="12" md="6" lg="2">
          <Card
            onClick={() => {
              if(curState === 'claim' && remainings[1] && remainings[1].name && remainings[1].name != 'addWorrior')
                unStake(remainings[1]);
            }}
            className="imageGrid"
            lg="3"
            style={{
              width: "100%",
              backgroundColor: "#2B3964",
              padding: "10px",
              borderRadius: "10px",
            }}
          >
            <Card.Img
              variant="top"
              src={remainings[1]?.image}
              alt={remainings[1]?.name}
            />
            <Card.Body>
              <Card.Title style={{ color: "#fff" }}>
                {remainings[1]?.name}
              </Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col xs="12" md="6" lg="2">
          <Card
            onClick={() => {
              if(curState === 'claim' && remainings[2] && remainings[2].name && remainings[2].name != 'addWorrior')
                unStake(remainings[2]);
            }}
            className="imageGrid"
            lg="3"
            style={{
              width: "100%",
              backgroundColor: "#2B3964",
              padding: "10px",
              borderRadius: "10px",
            }}
          >
            <Card.Img
              variant="top"
              src={remainings[2]?.image}
              alt={remainings[2]?.name}
            />
            <Card.Body>
              <Card.Title style={{ color: "#fff" }}>
                {remainings[2]?.name}
              </Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {
        <Row className='border-2 rounded-lg border-black mt-3 p-2'>
          <Col lg='2' className='inline-flex'>
            <Button onClick={prevQuest}>Prev</Button>
            <div className='mx-2'><p>{curQuest.title}</p><p>{curQuest.kage}$KAGE</p></div>
            <Button onClick={nextQuest}>Next</Button>
          </Col>
          {curQuest.index === 1 && (
          <Col lg='2'>
            <h1 className='text-3xl'>Time <b>00:00:{timer}</b></h1>
          </Col>
          )}
          {curQuest.index === 2 && (
          <Col lg='2'>
            <h1 className='text-3xl'>Time <b>00:00:{timer1}</b></h1>
          </Col>
          )}
          {curQuest.index === 3 && (
          <Col lg='2'>
            <h1 className='text-3xl'>Time <b>00:00:{timer2}</b></h1>
          </Col>
          )}
          {curState === "unstake" && (
          <Col lg='1'>
            <Button onClick={stake}>Stake</Button>
          </Col>
          )}
          {curState === "stake" && (
          <Col lg='1'>
            <Button onClick={lockStake}>Raid</Button>
          </Col>
          )}
          {curState === "claim" && (
          <Col lg='4'>
            <div className='mx-2'><p>3$KAGE</p></div>
            <Button onClick={claim}>Claim</Button>
          </Col>
          )}
        </Row>
      }
    </div>
  );
}

export default App;
