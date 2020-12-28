import { Container, Form, Grid, Header, Icon, Label, List, Message } from "semantic-ui-react";

import { Link, Redirect } from "react-router-dom";

import { useState, useEffect, Fragment } from "react";

import MainMenu from "../components/MainMenu";


function PortfolioList(response={results: []}) {

	let items = [];

	if (response.results.length > 0) {
		response.results.map((portfolio) => {
			items.push(
				<List.Item
					icon="book"
					as={Link}
					to={`/view/${portfolio.name}`}
					content={portfolio.name}
					key={portfolio.name}
				/>
			)
		})
	} else {
		items.push(<Fragment></Fragment>)
	}

	return (
		<List>
		    {items}
  		</List>
	)
}


export default function Home() {

	const [portfolios, setPortfolios] = useState(<Label content="Fetching portfolios..." />)
	const [portfolioId, setPortfolioId] = useState("")
	const [redirect, setRedirect] = useState(null)
	const [reloader, setReloader] = useState("")

	useEffect(() => {

		fetch(`/portfolio/`).then(response => {
			if (response.ok) {
				return response.json()
			} else {
				return response.json().then(json => {throw new Error(json.message)})
			}
		}).then((json) => {
			var newPortfolios = <PortfolioList {...json} />
			setPortfolios(newPortfolios)
		}).catch((e) => {
			setPortfolios(<Label color="red" content="Failed!" />)
		})

		
	}, [reloader])

	var onSubmit = () => {
		fetch(`/portfolio/`, {
			method: "post",
			body: JSON.stringify({ portfolio_id: portfolioId })
		}).then(response => {
			if (response.ok) {
				return response.json()
			} else {
				return response.json().then(json => {throw new Error(json.message)})
			}
		}).then((json) => {
			var newPortfolios = <PortfolioList {...json} />
			setPortfolios(newPortfolios)
			setReloader(reloader + "0")
		}).catch((e) => {
			setPortfolios(<Label color="red" content="Failed!" />)
		})
	}

	if (redirect) return redirect;

	return (

		<Container>
			<MainMenu healthy={<></>} />

			<Container text>
				<Grid>
					<Grid.Row style={{ marginTop: "2em" }} columns={1}>
						<Grid.Column>
							<div align="center">
								<Header size="huge">
									Erasmo
								</Header>
							</div>
						</Grid.Column>
					</Grid.Row>

					<Grid.Row columns={1}>
						<Grid.Column>
							<div align="center">
								<p>
									Erasmo is a tool to build fake stock portfolios. 

									<br></br>

									You can create a new portfolio, or you can view/modify
									an existing one.
								</p>
							</div>
						</Grid.Column>
					</Grid.Row>

					<Grid.Row columns={2}>
						<Grid.Column>
							<Form onSubmit={onSubmit}>
								<Header size="large">
									New Portfolio
								</Header>
								<Form.Input
									label="Portfolio Name"
									onChange={(e) => setPortfolioId(e.target.value)}
									value={portfolioId}
								/>
								<div align="right">
									<Form.Button type="submit" color="green" content="Create" />
								</div>
							</Form>
						</Grid.Column>
						<Grid.Column>
							<Header size="large">
								Existing Portfolios
							</Header>
							{portfolios}	
						</Grid.Column>
					</Grid.Row>

					<Grid.Row columns={1}>
						<Grid.Column>
							<Message icon color="yellow">
							    <Icon name='warning sign' />
							    <Message.Content>
							      <Message.Header>Disclaimer</Message.Header>
							      This is an app built for fun to buy and sell <b>fake</b> stocks. 
							      The "transactions" on this platform are entirely fake, and
							      should obviously not be used for any kind of investment
							      decision.
							    </Message.Content>
							  </Message>
						</Grid.Column>
					</Grid.Row>

				</Grid>
			</Container>

		</Container>
	)
}