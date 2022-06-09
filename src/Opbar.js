import { Col, Row, Button } from "react-bootstrap";

function Opbar(props) {

    function prevQuest() {
        if(props.curState === 'stake') return;
        let idx = props.curQuest.index;
        if(idx > 1) {
            props.changeQuest(idx-1);
        }
      }
    
    function nextQuest() {
        if(props.curState === 'stake') return;
        let idx = props.curQuest.index;
        if(idx < 3) {
            props.changeQuest(idx+1);
        }
    }
    
    return (
        <Row className='border-2 rounded-lg border-black mt-3 p-2'>
          <Col lg='3' className='inline-flex'>
            <Button onClick={prevQuest}>Prev</Button>
            <div className='mx-3 text-2xl'><p>{props.curQuest.title}</p><p>{props.curQuest.kage}$KAGE</p></div>
            <Button onClick={nextQuest}>Next</Button>
          </Col>
          <Col lg='3'>
            <h1 className='text-3xl'>Time <b>00:00:{props.curtime}</b></h1>
          </Col>
          {props.curState === "unstake" && (
          <Col lg='1'>
            <Button onClick={props.stake}>Stake</Button>
          </Col>
          )}
          {props.curState === "stake" && (
          <Col lg='1'>
            <Button onClick={props.lockStake}>Raid</Button>
          </Col>
          )}
          {props.curState === "lock" && (
          <Col lg='4'>
            <div className='mx-2'><p>3$KAGE</p></div>
            <Button onClick={props.claim}>Claim</Button>
          </Col>
          )}
        </Row>
    );
}

export default Opbar;