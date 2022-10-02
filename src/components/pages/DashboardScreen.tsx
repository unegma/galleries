import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Input from "@mui/material/Input";
import Button from "@mui/material/Button";
import React, {Suspense, useEffect, useState} from "react";
import {Environment, Html, OrbitControls} from "@react-three/drei";
import {Canvas} from "@react-three/fiber";
// import ReserveToken from "../3d/ReserveToken";
import {InputAdornment} from "@mui/material";
import {deploy721A} from "../../helpers/web3Functions";
import {Contract, Signer} from "ethers";
import {useWeb3React} from "@web3-react/core";
import {Web3Provider} from "@ethersproject/providers";
import {Phase} from "../../types/Phase";
import {ERC20Info} from "../../types/ERC20Info";
// import Warning from "../various/Warning";
// import {TransactionsChartDeploy} from "../various/TransactionsChartDeploy";
const BASE_URL = process.env.REACT_APP_BASE_URL;
const RESERVE_EXAMPLE = process.env.REACT_APP_RESERVE_EXAMPLE;
const GITHUB_LINK = process.env.REACT_APP_GITHUB_URL;

type adminPanelProps = {
}

export default function DashboardScreen({} : adminPanelProps) {
  const context = useWeb3React<Web3Provider>(); // todo check because this web3provider is from ethers
  const { connector, library, chainId, account, activate, deactivate, active, error }: any = context;

  const [signer, setSigner] = useState<Signer|undefined>(undefined);

  const [adminConfigPage, setAdminConfigPage] = useState(0);
  const [reserveClaimable, setReserveClaimable] = useState("100"); // todo remove

  const [collectionName, setCollectionName] = React.useState("Test");
  const [collectionSymbol, setCollectionSymbol] = React.useState("tTKN");
  const [description, setDescription] = React.useState("A Description");
  const [supply, setSupply] = React.useState("20");
  const [royaltyPercentage, setRoyaltyPercentage] = React.useState("20");
  const [currency, setCurrency] = React.useState("MATIC");

  const [imageURL, setImageURL] = React.useState("ImageURL");

  // roles: admin, recipient, owner

  const [saleStart, setSaleStart] = React.useState("1/1/2000");
  const [saleEnd, setSaleEnd] = React.useState("1/1/2000"); // forever
  const [pricingRule, setPricingRule] = React.useState("Fixed");
  const [price, setPrice] = React.useState("1");
  // no wallet cap
  // no restrictions on allowed groups

  const [soulbound, setSoulBound] = React.useState("true");

  // rain script

  const [buttonLock, setButtonLock] = useState(false);

  useEffect(() => {
    setSigner(library?.getSigner());
  }, [library, account]);

  function resetToDefault() {
    // setReserveClaimable("100");
    setCollectionName("Test");
    setCollectionSymbol("tTKN");
    setDescription("A Description");
    setSupply("20");
    setRoyaltyPercentage("20");
    setCurrency("MATIC");
    setImageURL("ImageURL");
    setSaleStart("1/1/2020");
    setSaleEnd("1/1/2020");
    setPricingRule("Fixed");
    setPrice("1");
    setSoulBound("true");
  }

  const handleChangeCollectionName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCollectionName(event.target.value);
  }
  const handleChangeCollectionSymbol = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCollectionSymbol(event.target.value);
  }
  const handleChangeDescription = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(event.target.value);
  }
  const handleChangeSupply = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSupply(event.target.value);
  }
  const handleChangeRoyaltyPercentage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRoyaltyPercentage(event.target.value);
  }
  const handleChangeCurrency = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrency(event.target.value);
  }
  const handleChangeImageURL = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageURL(event.target.value);
  }
  const handleChangeSaleStart = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSaleStart(event.target.value);
  }
  const handleChangeSaleEnd = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSaleEnd(event.target.value);
  }
  const handleChangePricingRule = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPricingRule(event.target.value);
  }
  const handleChangePrice = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(event.target.value);
  }
  const handleChangeSoulBound = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSoulBound(event.target.value);
  }






  // const handleChangeReserveName = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setReserveName(event.target.value);
  // }
  // const handleChangeReserveSymbol = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   let newReserveSymbol = event.target.value;
  //   // if (newReserveSymbol.length <= 0) { alert("Must be > 0."); return;}
  //   if (newReserveSymbol.length > 11) { alert("Symbol must be 11 characters or less."); return;}
  //   setReserveSymbol(newReserveSymbol);
  // }
  // const handleChangeReserveClaimable = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   let newClaimable = event.target.value;
  //   if (parseInt(newClaimable) <= 0) { alert("Must be > 0."); return;}
  //   if (parseInt(newClaimable) > 1000) { alert("Can't have more than 1000 in this example."); return;}
  //   // if (newClaimable == "") { alert("Must be > 0."); return;}
  //   setReserveClaimable(newClaimable);
  // }

  const deployToken = async () => {
    let config = {
      name: collectionName,
      symbol: collectionSymbol,
      description: description,
      maxSupply: supply,
      currency: currency,
      royalty: royaltyPercentage,
      recipient: account,
      owner: account,
      admin: account,
      useNativeToken: true,
      soulbound: true,
    }

    await deploy721A(signer, account, config);
  };

  return (
    <>
      {/*<div className="home-screen-cover">*/}
        {/*<div className="home-screen-button-container">*/}
        {/*  <Button size='large' className="home-screen-button" variant='contained' onClick={(event:any) => {toggleLeftSideDrawer(event)}}>Enter</Button>*/}
        {/*</div>*/}
      {/*</div>*/}
      {/*<div className="home-screen-image" style={{backgroundImage: `url(${process.env.REACT_APP_ASSETS_URL}/ark.jpeg)`}}/>*/}

      <p className={'github github--firstview'}><a href={`${GITHUB_LINK}`} target="_blank">(Github Link)</a></p>

      <Box
        className="admin-form"
        component="form"
        sx={{
          '& > :not(style)': { m: 1 },
        }}
        noValidate
        autoComplete="off"
      >

        <Typography variant="h4" component="h2" color="black" align="center">
          Configure Faucet Deployment
        </Typography>

        { adminConfigPage === 0 && (
          <>
            <Typography color="black" align="center">
              <a className="bullet" href="https://youtu.be/4aIbUDuW9CM" target="_blank">Rain Protocol Examples Intro Video</a><br/>
              <a className='bullet'  href="https://docs.rainprotocol.xyz">Docs at: docs.rainprotocol.xyz</a><br/>
              {/*todo change to rUSD?*/}
              <a className='bullet'  href={`${window.location.origin}/${RESERVE_EXAMPLE}`} target="_blank">Example Faucet: Rain USD (rUSD)</a>
            </Typography>
          </>
        )}

        {/*<Canvas hidden={!(adminConfigPage !== 1)} className="the-canvas-deploypanel" camera={{ position: [0, 0, 20], fov: 20 }} performance={{ min: 0.1 }}>*/}
        {/*  <ambientLight intensity={0.1} />*/}
        {/*  <directionalLight intensity={0.01} position={[5, 25, 20]} />*/}
        {/*  <Suspense fallback={<Html className="black">loading..</Html>}>*/}
        {/*    /!*<ReserveToken rotation={[1,1,1]} reserveSymbol={reserveSymbol} />*!/*/}
        {/*    <Environment preset="studio" />*/}
        {/*  </Suspense>*/}
        {/*  <OrbitControls autoRotate autoRotateSpeed={1} enableZoom={false} enablePan={false} enableRotate={false} />*/}
        {/*</Canvas>*/}



        { adminConfigPage === 0 && (
          <>
            <Typography variant="h5" component="h3" color="black">
              (Page 1/2)
            </Typography>

            <FormControl variant="standard">
              <InputLabel className="input-box-label" htmlFor="component-helper">Collection Name</InputLabel>
              <Input
                id="component-helper"
                value={collectionName}
                onChange={handleChangeCollectionName}
              />
            </FormControl>


            <FormControl variant="standard">
              <InputLabel className="input-box-label" htmlFor="component-helper">Collection Symbol</InputLabel>
              <Input
                id="component-helper"
                value={collectionSymbol}
                onChange={handleChangeCollectionSymbol}
              />
            </FormControl>

            <FormControl variant="standard">
              <InputLabel className="input-box-label" htmlFor="component-helper">Description</InputLabel>
              <Input
                id="component-helper"
                value={description}
                onChange={handleChangeDescription}
              />
            </FormControl>

            <FormControl variant="standard">
              <InputLabel className="input-box-label" htmlFor="component-helper">Supply</InputLabel>
              <Input
                id="component-helper"
                value={supply}
                onChange={handleChangeSupply}
              />
            </FormControl>

            <FormControl variant="standard">
              <InputLabel className="input-box-label" htmlFor="component-helper">Royalty Percentage</InputLabel>
              <Input
                id="component-helper"
                value={royaltyPercentage}
                onChange={handleChangeRoyaltyPercentage}
              />
            </FormControl>

            <FormControl variant="standard">
              <InputLabel className="input-box-label" htmlFor="component-helper">Currency</InputLabel>
              <Input
                id="component-helper"
                value={currency}
                onChange={handleChangeCurrency}
              />
            </FormControl>




            <FormControl variant="standard">
              <InputLabel className="input-box-label" htmlFor="component-helper">Image URL</InputLabel>
              <Input
                id="component-helper"
                value={imageURL}
                onChange={handleChangeImageURL}
              />
            </FormControl>

            <FormControl variant="standard">
              <InputLabel className="input-box-label" htmlFor="component-helper">Sale Start</InputLabel>
              <Input
                id="component-helper"
                value={saleStart}
                onChange={handleChangeSaleStart}
              />
            </FormControl>


            <FormControl variant="standard">
              <InputLabel className="input-box-label" htmlFor="component-helper">Sale End</InputLabel>
              <Input
                id="component-helper"
                value={saleEnd}
                onChange={handleChangeSaleEnd}
              />
            </FormControl>

            <FormControl variant="standard">
              <InputLabel className="input-box-label" htmlFor="component-helper">Pricing Rule</InputLabel>
              <Input
                id="component-helper"
                value={pricingRule}
                onChange={handleChangePricingRule}
              />
            </FormControl>

            <FormControl variant="standard">
              <InputLabel className="input-box-label" htmlFor="component-helper">Price</InputLabel>
              <Input
                id="component-helper"
                value={price}
                onChange={handleChangePrice}
              />
            </FormControl>

            <FormControl variant="standard">
              <InputLabel className="input-box-label" htmlFor="component-helper">Soul Bound</InputLabel>
              <Input
                id="component-helper"
                value={soulbound}
                onChange={handleChangeSoulBound}
              />
            </FormControl>


            {/*<FormControl variant="standard">*/}
            {/*  <InputLabel className="input-box-label" htmlFor="component-helper">Amount a Faucet User will Receive Each Claim</InputLabel>*/}
            {/*  <Input*/}
            {/*    id="component-helper"*/}
            {/*    value={reserveClaimable}*/}
            {/*    onChange={handleChangeReserveClaimable}*/}
            {/*    endAdornment={<InputAdornment position="end">{reserveSymbol}</InputAdornment>}*/}
            {/*  />*/}
            {/*</FormControl>*/}

            <div className="buttons-box">
              <Button className="fifty-percent-button" variant="outlined" onClick={() => {resetToDefault()}}>Reset</Button>
              <Button className="fifty-percent-button" variant="contained" onClick={() => {setAdminConfigPage(adminConfigPage+1)}}>Next</Button>
            </div>
          </>
        )}

        { adminConfigPage === 1 && (
          <>
            {/*<TransactionsChartDeploy />*/}

            <Typography variant="h5" component="h3" color="black">
              (Page 2/2)
            </Typography>

            {/*<Warning />*/}

            <div className="buttons-box">
              <Button className="fifty-percent-button" variant="outlined" onClick={() => {setAdminConfigPage(adminConfigPage-1)}}>Previous</Button>
              <Button className="fifty-percent-button" disabled={buttonLock} variant="contained" onClick={() => {deployToken()}}>Deploy</Button>
            </div>
          </>
        )}
      </Box>

    </>
  )
}
