import { Doughnut } from "react-chartjs-2";
import { useParams, Redirect } from "react-router-dom";
import { Button, Container, Dropdown, Form, Grid, Header, Input, Label, Loader, Statistic } from "semantic-ui-react";

import { useEffect, useState } from "react";

import React from "react"

import MainMenu from "../components/MainMenu"


function randomRgba() {
    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ')';
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function buildDoughnut(response) {
	let labels = [];
	let shares = [];
	let colors = [];
	// TODO: Add values (need price from backend)
	let companies = response.results.companies;

	let chart;

	if (companies.length > 0) {
		companies.map(company => {
			labels.push(company.ticker)
			shares.push(company.shares)
			colors.push(randomRgba())
		})

		let chartData = {
			labels: labels,
			datasets: [{data: shares, backgroundColor: colors}]
		}

		chart = <Doughnut data={chartData} />

	} else {
		chart = (
			<div align="center">
				There's nothing here! Make a transaction below.
			</div>
		)
	}

	
	return chart
}


export default function Portfolio() {

	const [doughnut, setDoughnut] = useState(<Loader active />);
	const [healthy, setHealthy] = useState(<Label color="grey" content="Checking health..." />);
	const [reloader, setReloader] = useState("");
	const [intention, setIntention] = useState("ADD");
	const [shares, setShares] = useState(10);
	const [ticker, setTicker] = useState("AAPL");
	const [feedback, setFeedback] = useState(<React.Fragment></React.Fragment>)
	const [value, setValue] = useState("Fetching portfolio stats...")
	const [redirect, setRedirect] = useState(null)


	var params = useParams();

	var onSubmit = () => {
		let data = {
			ticker: ticker,
			shares: shares,
			intention: intention,
		}
		let newReloader = reloader + "0";
		setFeedback(<Loader active />)

		fetch(`/portfolio/${params.portfolioId}`, {
			method: 'post',
    		body: JSON.stringify(data)
		}).then(response => {
			if (response.ok) {
				return response.json()
			} else {
				return response.json().then(json => {throw new Error(json.message)})
			}

		}).then((json) => {
			setReloader(newReloader)
			setFeedback(<Label color="green" content="Success!" />)
		}).catch((e) => {
			setFeedback(<Label color="red" content={e.message} />)
		})

		
	}

	var onDeletePortfolio = () => {
		fetch(`/portfolio/`, {
			method: 'DELETE',
  		body: JSON.stringify({ portfolio_id: params.portfolioId })
		}).then(response => {
			if (response.ok) {
				return response.json()
			} else {
				return response.json().then(json => {throw new Error(json.message)})
			}

		}).then((json) => {
			setRedirect(<Redirect to="/" />)
		}).catch((e) => {
			setFeedback(<Label color="red" content={e.message} />)
		})
	}

	// Check the health of the system
	useEffect(() => {

		fetch("/ping").then(response => {
			if (response.ok) {
				return response.text()	
			}
			else {
				throw Error(response.statusText);
			}
		}).then(text => {
			setHealthy(<Label color="green" content="Healthy" />)
		}).catch((e) => {
			setHealthy(<Label color="red" content="Unhealthy" />)
		})

	}, [params, reloader])

	// Populate the components that depend on the fetch
	useEffect(() => {

		fetch(`/portfolio/${params.portfolioId}`).then(response => {
			if (response.ok) {
				return response.json()	
			}
			else {
				throw Error(response.statusText);
			}
		}).then(json => {
			let newValue = json.results.value
			let newDoughnut = buildDoughnut(json)
			setDoughnut(newDoughnut)
			setValue(
				<Statistic>
			    <Statistic.Value>${numberWithCommas(newValue.toFixed(2))}</Statistic.Value>
			    <Statistic.Label>Total portfolio value</Statistic.Label>
			  </Statistic>
			 )
		}).catch((e) => {
			let txt = "Hmm... Can't find this portfolio. You sure it exists?";
			setDoughnut(<Label color="red" content={`${txt}`} />)
		})
		
		
	}, [params, reloader])

	if (redirect) return redirect;

	return (
		<Container>
			<MainMenu healthy={healthy} />

			<Container text>

				<Grid>

					<Grid.Row columns={1}>
						<Grid.Column>
							<Header size="huge">
								{params.portfolioId}
							</Header>
						</Grid.Column>
					</Grid.Row>

					<Grid.Row columns={1}>
						<Grid.Column>
							<div align="center">
								{value}
							</div>
						</Grid.Column>
					</Grid.Row>

					<Grid.Row columns={1}>
						<Grid.Column>
							{doughnut}
						</Grid.Column>
					</Grid.Row>

					<Grid.Row columns={1}>
						<Grid.Column>
							<div align="center">
								<Form onSubmit={onSubmit}>
									<p>
										I want to 
										<Dropdown
										    placeholder='Select an action'
										    selection
										    options={[ {key: "ADD", text: "ADD", value: "ADD"}, {key: "REMOVE", text: "REMOVE", value: "REMOVE"} ]}
										    value={intention}
										    onChange={(e) => setIntention(e.target.innerText)}
										  />
										 <Input
										 	placeholder="10" 
										 	value={shares}
										 	onChange={(e) => setShares(e.target.value)}
										 />
										shares of 
										<Input
											placeholder="AAPL" 
											value={ticker}
											onChange={(e) => setTicker(e.target.value)}
										/>
									</p>
									<Form.Button type="submit">
										Submit
									</Form.Button>
								</Form>
							</div>
						</Grid.Column>
					</Grid.Row>

					<Grid.Row columns={1}>
						<Grid.Column>
							{feedback}
						</Grid.Column>
					</Grid.Row>

					<Grid.Row columns={1}>
						<Grid.Column>
							<div align="right">
								<Button
									icon='trash'
									color="red"
									content="Delete this portfolio" 
									onClick={onDeletePortfolio}
								/>
							</div>
						</Grid.Column>
					</Grid.Row>

				</Grid>

			</Container>


		</Container>
	)
}