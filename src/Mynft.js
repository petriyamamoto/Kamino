import AlertDismissible from './alert/alertDismissible';
import { Col, Row, Card, Spinner } from "react-bootstrap";

function Mynfs(props) {
    return (
        <Row className='h-64 border-2 rounded-xl border-black'>
          {props.loading && (
            <div className="loading">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          )}
          {props.show && (
            <AlertDismissible title={props.title} message={props.message} setShow={props.setShow} />
          )}

          {!props.loading &&
            props.nfts.map((metadata, index) => (
              <Col xs="12" md="6" lg="2" key={index}>
                <Card
                  onClick={() => {
                    props.addRemainings(metadata);
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
    );
}

export default Mynfs;