import { Doughnut } from "react-chartjs-2";
import { useParams } from "react-router-dom";
import { Container, Dropdown, Form, Grid, Header, Input, Label, Loader } from "semantic-ui-react";

import { useEffect, useState } from "react";

import React from "react"


function randomRgba() {
    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ')';
}


function buildDoughnut(response) {
	let labels = [];
	let shares = [];
	let colors = [];
	// TODO: Add values (need price from backend)
	let companies = response.results.companies;

	companies.map(company => {
		labels.push(company.ticker)
		shares.push(company.shares)
		colors.push(randomRgba())
	})

	let chartData = {
		labels: labels,
		datasets: [{data: shares, backgroundColor: colors}]
	}

	let chart = <Doughnut data={chartData} />
	return chart
}


export default function Portfolio() {

	const [doughnut, setDoughnut] = useState(<Loader active />);
	const [healthy, setHealthy] = useState(<Label color="grey" content="Checking health..." />);

	var params = useParams();

	// Check the health of the system
	useEffect(() => {

		fetch("/yikes").then(response => {
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

	}, [params])

	// Populate the dougnhut data chart
	useEffect(() => {

		fetch(`/portfolio/${params.portfolioId}`).then(response => {
			if (response.ok) {
				return response.json()	
			}
			else {
				throw Error(response.statusText);
			}
		}).then(json => {
			let newDoughnut = buildDoughnut(json)
			setDoughnut(newDoughnut)
		}).catch((e) => {
			let txt = "Hmm... Can't find this portfolio. You sure it exists?";
			setDoughnut(<Label color="red" content={`${txt}`} />)
		})
		
		
	}, [params])

	return (
		<Container style={{ marginTop: "2em" }}>
			<div align="right">
				{healthy}
			</div>
			<div align="left">
				<Header>
					Erasmo
				</Header>
			</div>

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
							{doughnut}
						</Grid.Column>
					</Grid.Row>

					<Grid.Row columns={1}>
						<Grid.Column>
							<div align="center">
								<Form>
									I want to 
									<Dropdown
									    placeholder='Select an action'
									    selection
									    options={[ {key: "ADD", text: "ADD", value: "ADD"} ]}
									  />
									 <Input placeholder="10" />
									shares of 
									<Input placeholder="AAPL" />
									<Form.Button>
										Submit
									</Form.Button>
								</Form>
							</div>
						</Grid.Column>
					</Grid.Row>

				</Grid>

			</Container>


		</Container>
	)
}