import { Button, Container, Input, Label, Menu } from "semantic-ui-react";

import { Link } from "react-router-dom";

export default function MainMenu({ healthy=<Label color="grey" content="Checking health..." /> }) {



	return (
		<Container style={{ marginTop: "3em" }}>
			<Menu secondary>
		        <Menu.Item
		          name='Erasmo'
		          as={Link}
		          to="/"
		        />
		        <Menu.Menu position='right'>
		          <Menu.Item>
		            {healthy}
		          </Menu.Item>
		        </Menu.Menu>
	      	</Menu>
      	</Container>
	)
}