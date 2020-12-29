import { Doughnut, Line } from "react-chartjs-2";
import { useParams, Redirect } from "react-router-dom";
import { Button, Container, Dropdown, Form, Grid, Header, Input, Label, Loader, Message, Statistic } from "semantic-ui-react";

import { useEffect, useState } from "react";

import React from "react"

import MainMenu from "../components/MainMenu"

import getSettings from "../settings"

const settings = getSettings()

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function stringToHex(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var colour = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return colour;
}

function hexToRgbA(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',1)';
    }
    throw new Error('Bad Hex');
}


function stringToColor(str) {
	let hex = stringToHex(str)
	let rgba = hexToRgbA(hex)
	return rgba
}


function buildHistoricalPricesAgg(response) {
	let labels = [];
	let prices = [];
	let chart;

	if (response.results.prices) {
		let history = response.results.prices.Total

		for (const [dateInt, price] of Object.entries(history)) {

			let date = new Date(parseInt(dateInt));

		  labels.push(date.toLocaleDateString())
		  prices.push(price)
		}

		let chartData = {
		  labels: labels,
		  datasets: [
		    {
		      label: 'Portfolio Value ($)',
		      data: prices,
		      fill: false,
		      backgroundColor: 'rgb(255, 99, 132)',
		      borderColor: 'rgba(255, 99, 132, 0.2)',
		    },
		  ],
		}
		chart = <Line data={chartData} />
	} else {
		chart = (
			<div>
			</div>
		)
	}


	

	return chart
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
			colors.push(stringToColor(company.ticker))
		})

		let chartData = {
			labels: labels,
			datasets: [{data: shares, backgroundColor: colors}]
		}

		chart = <Doughnut data={chartData} />

	} else {
		chart = (
			<div>
			</div>
		)
	}

	
	return chart
}


export default function Portfolio() {

	
	// Used to reload useEffects
	const [reloader, setReloader] = useState("");

	// Health Check
	const [healthy, setHealthy] = useState(<Label color="grey" content="Checking health..." />);
	
	// Redirects
	const [redirect, setRedirect] = useState(null)

	// Graphs
	const [doughnut, setDoughnut] = useState(<Loader active />);
	const [timeChart, setTimeChart] = useState(<Loader active />);

	// Constrols the state of the form to CRUD shares
	const [success, setSuccess] = useState(false)
	const [successMsg, setSuccessMsg] = useState("")
	const [error, setError] = useState(false)
	const [errMsg, setErrMsg] = useState("")
	const [loading, setLoading] = useState(false)

	// Controls the values in the form
	const [intention, setIntention] = useState("ADD");
	const [shares, setShares] = useState(10);
	const [ticker, setTicker] = useState("AAPL");
	const [value, setValue] = useState("Fetching portfolio stats...")


	var params = useParams();

	var onSubmit = () => {
		setLoading(true)
		setError(false)
		setSuccess(false)
		let data = {
			ticker: ticker,
			shares: shares,
			intention: intention,
		}
		let newReloader = reloader + "0";

		fetch(`${settings.apiUrl}/portfolio/${params.portfolioId}`, {
			method: 'post',
    		body: JSON.stringify(data)
		}).then(response => {
			if (response.ok) {
				return response.json()
			} else {
				return response.json().then(json => {throw new Error(json.message)})
			}

		}).then((json) => {
			setDoughnut(<Loader active/>)
			setTimeChart(<Loader active/>)
			setLoading(false)
			let msg = `${intention} ${shares} ${ticker} completed successfully!`
			setSuccessMsg(msg)
			setSuccess(true)
			setReloader(newReloader)
		}).catch((e) => {
			setLoading(false)
			setErrMsg(e.toString())
			setError(true)
		})

		
	}

	var onDeletePortfolio = () => {
		setError(false)
		setSuccess(false)
		fetch(`${settings.apiUrl}/portfolio/`, {
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
			setError(true)
			setErrMsg(e.toString())
		})
	}

	// Check the health of the system
	useEffect(() => {

		fetch(`${settings.apiUrl}/ping`).then(response => {
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

		fetch(`${settings.apiUrl}/portfolio/${params.portfolioId}`).then(response => {
			if (response.ok) {
				return response.json()	
			}
			else {
				throw Error(response.statusText);
			}
		}).then(json => {
			let newValue = json.results.value
			let newDoughnut = buildDoughnut(json)
			let newTimeChart = buildHistoricalPricesAgg(json)
			setDoughnut(newDoughnut)
			setTimeChart(newTimeChart)
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

			<Container>

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

					<Grid.Row columns={2}>
						<Grid.Column>
							{timeChart}
						</Grid.Column>
						<Grid.Column>
							{doughnut}
						</Grid.Column>
					</Grid.Row>

					<Grid.Row columns={1}>
						<Grid.Column>
							<div align="center">
								<Form onSubmit={onSubmit} success={success} loading={loading} error={error}>
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
									<Message
							      success
							      header='Transaction Succeeded'
							      content={successMsg}
							    />
							    <Message
							      error
							      header='Transaction Failed'
							      content={errMsg}
							    />
									<Form.Button type="submit">
										Submit
									</Form.Button>
								</Form>
							</div>
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