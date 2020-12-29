import { Container, Form, Grid, Header, Icon, Image, Label, Loader, List, Message } from "semantic-ui-react";

import { Link, Redirect } from "react-router-dom";

import { useState, useEffect, Fragment } from "react";

import MainMenu from "../components/MainMenu";
import Footer from "../components/Footer";
import getSettings from "../settings"

import logo from "../imgs/transparentNoText.png"


const settings = getSettings()

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

	// Controls the state of the "add portfolio" form
	const [success, setSuccess] = useState(false)
	const [successMsg, setSuccessMsg] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(false)
	const [errMsg, setErrMsg] = useState("")


	useEffect(() => {

		fetch(`${settings.apiUrl}/portfolio/`).then(response => {
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
		// Display things as loading
		setLoading(true)

		fetch(`${settings.apiUrl}/portfolio/`, {
			method: "post",
			body: JSON.stringify({ portfolio_id: portfolioId })
		}).then(response => {
			if (response.ok) {
				return response.json()
			} else {
				return response.json().then(json => {throw new Error(json.message)})
			}
		}).then((json) => {
			setRedirect(<Redirect to={`/view/${portfolioId}`} />)
		}).catch((e) => {
			setPortfolios("An error occured. Please refresh the page.")
			setLoading(false)
			setError(true)
			setErrMsg(e.toString())
		})
	}

	if (redirect) return redirect;

	return (

		<Container>
			<MainMenu healthy={null} />

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
								<Image src={logo} size="small" />
								<p>
									Erasmo is a tool to build fake stock portfolios. 

								</p>

								<p>
									You can create a new portfolio, or you can view/modify
									an existing one.
								</p>
							</div>
						</Grid.Column>
					</Grid.Row>

					<Grid.Row columns={2}>
						<Grid.Column>
							<Form onSubmit={onSubmit} loading={loading} success={success} error={error}>
								<Header size="large">
									New Portfolio
								</Header>
								<Form.Input
									label="Portfolio Name"
									onChange={(e) => setPortfolioId(e.target.value)}
									value={portfolioId}
								/>
								<Message
						      success
						      header={successMsg}
						    />
						    <Message
						      error
						      header={errMsg}
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

				</Grid>
			</Container>

		<Footer />

		</Container>
	)
}