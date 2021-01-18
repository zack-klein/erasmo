import {
  Button,
  Container,
  Image,
  Input,
  Label,
  Menu,
} from "semantic-ui-react";

import { Link } from "react-router-dom";

import logo from "../imgs/transparentNoText.png";

export default function MainMenu({
  healthy = <Label color="grey" content="Checking health..." />,
}) {
  return (
    <Container style={{ marginTop: "1em" }}>
      <Menu>
        <Menu.Item as={Link} to="/">
          <Image src={logo} size="mini" circular />
          Erasmo
        </Menu.Item>
        {healthy ? (
          <Menu.Menu position="right">
            <Menu.Item>{healthy}</Menu.Item>
          </Menu.Menu>
        ) : (
          <div></div>
        )}
      </Menu>
    </Container>
  );
}
