import { Doughnut, Line } from "react-chartjs-2";
import { useParams, Redirect } from "react-router-dom";
import { Button, Checkbox, Container, Dropdown, Form, Grid, Header, Icon, Input, Label, Loader, Modal, Message, Statistic } from "semantic-ui-react";

import { useEffect, useState } from "react";

import React from "react"

import MainMenu from "../components/MainMenu"
import Footer from "../components/Footer"

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


function buildHistoricalPrices(response, aggregated) {
	let chart;
	let chartData;
	let labels = [];

	if (response.results.prices) {
		
		if (aggregated) {

			let prices = [];
			let history = response.results.prices.Total
			for (const [dateInt, price] of Object.entries(history)) {
				let date = new Date(parseInt(dateInt));
			  	labels.push(date.toLocaleDateString())
			  	prices.push(parseInt(price))
			}
			

			chartData = {
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

		} else {

			let datasets = [];
			let history = response.results.prices.Total

			for (const [dateInt, price] of Object.entries(history)) {

				let date = new Date(parseInt(dateInt));
			  	labels.push(date.toLocaleDateString())
			  	
			}

			let companyPrices = response.results.prices

			for (const [company, companyHistory] of Object.entries(companyPrices)) {
				
				if (company != "Total") {

					let prices = [];
					for (const [dateInt, price] of Object.entries(companyHistory)) {
						prices.push(price)
					}
					let dataset = {
				      label: company,
				      data: prices,
				      fill: false,
				      backgroundColor: stringToColor(company),
				      borderColor: stringToColor(company),
				    }
				    datasets.push(dataset)
				}
			}

			chartData = {
			  labels: labels,
			  datasets: datasets,
			}

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

function DeleteModal({ portfolioId, deletePortfolio=() => null }) {
	const [open, setOpen] = React.useState(false)

	var onDelete = () => {
		deletePortfolio()
		setOpen(false)
	}

	return (
		<Modal
	      closeIcon
	      open={open}
	      trigger={<Button color="red" icon="trash" content={`Delete ${portfolioId}`}  />}
	      onClose={() => setOpen(false)}
	      onOpen={() => setOpen(true)}
	    >
	      <Header icon='trash' content='Confirmation Required' />
	      <Modal.Content>
	        <p>
	          There's no going back! Are you sure you'd like to delete this {portfolioId}?
	        </p>
	      </Modal.Content>
	      <Modal.Actions>
	        <Button color='grey' onClick={() => setOpen(false)}>
	          Cancel
	        </Button>
	        <Button color='red' onClick={onDelete}>
	          <Icon name='remove' /> Delete
	        </Button>
	      </Modal.Actions>
	    </Modal>
	)
}


export default function Portfolio() {

	
	// Used to reload useEffects
	const [reloader, setReloader] = useState("");

	// Health Check
	const [healthy, setHealthy] = useState(<Label color="grey" content="Checking health..." />);
	
	// Redirects
	const [redirect, setRedirect] = useState(null)

	// Graphs
	const [portfolioValue, setPortfolioValue] = useState("Fetching portfolio stats...")
	const [doughnut, setDoughnut] = useState(<Loader active />);
	const [timeChart, setTimeChart] = useState(<Loader active />);
	const [aggTimeChartCheck, setAggTimeChartCheck] = useState(<div></div>);
	const [aggTimeChart, setAggTimeChart] = useState(false);

	// Constrols the state of the form to CRUD shares
	const [success, setSuccess] = useState(false)
	const [successMsg, setSuccessMsg] = useState("")
	const [error, setError] = useState(false)
	const [errMsg, setErrMsg] = useState("")
	const [loading, setLoading] = useState(false)

	// Controls the values in the form
	const [intention, setIntention] = useState("ADD");
	const [shares, setShares] = useState(10);
	const [ticker, setTicker] = useState("");


	var params = useParams();

	var buildAggregateCheckbox = (response) => {

		let checkbox;

		if (response.results.prices) {
			checkbox = (
				<div align="center">
					<Checkbox 
						label='Group Stocks'
						checked={aggTimeChart}
						onChange={onAggregateTimeChart}
					/>
				</div>
			)
		} else {
			checkbox = null
		}
		console.log(response)

		return checkbox
	}

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
			// Reset the charts to be loading
			setDoughnut(<Loader active/>)
			setTimeChart(<Loader active/>)
			setPortfolioValue("Recalculating portfolio value...")
			setAggTimeChartCheck(null)
			setLoading(false)
			let msg = `${intention} ${shares} ${ticker} completed successfully!`
			setSuccessMsg(msg)
			setSuccess(true)

			// Trigger reloads
			setReloader(newReloader)
		}).catch((e) => {
			setLoading(false)
			setErrMsg(e.toString())
			setError(true)
		})
	}

	var onAggregateTimeChart = () => {
		setTimeChart(<Loader active />)
		setAggTimeChartCheck(null)
		setAggTimeChart(!aggTimeChart)
		setReloader(reloader + " ")
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
			let newTimeChart = buildHistoricalPrices(json, aggTimeChart)
			let newCheckbox = buildAggregateCheckbox(json)
			setDoughnut(newDoughnut)
			setTimeChart(newTimeChart)
			setAggTimeChartCheck(newCheckbox)
			setPortfolioValue(
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

			<Container style={{ marginTop: "1em" }}>

				<Grid>

					<Grid.Row columns={1}>
						<Grid.Column>
							<Header size="huge">
								<div align="center">
									{params.portfolioId}
								</div>
							</Header>
						</Grid.Column>
					</Grid.Row>

					<Grid.Row columns={1}>
						<Grid.Column>
							<div align="center">
								{portfolioValue}
							</div>
						</Grid.Column>
					</Grid.Row>

					<Grid.Row columns={2}>
						<Grid.Column>
							{timeChart}
							{aggTimeChartCheck}
						</Grid.Column>
						<Grid.Column>
							{doughnut}
						</Grid.Column>
					</Grid.Row>

					<Grid.Row columns={1}>
						<Grid.Column>
							<div align="center">
								<Form onSubmit={onSubmit} success={success} loading={loading} error={error}>
									<Form.Field inline>
										<label>I want to </label>
										<Dropdown
										    placeholder='Select an action'
										    selection
										    options={[ {key: "ADD", text: "ADD", value: "ADD"}, {key: "REMOVE", text: "REMOVE", value: "REMOVE"} ]}
										    value={intention}
										    onChange={(e) => setIntention(e.target.innerText)}
										  />
									</Form.Field>
									<Form.Field inline>
										 <Input
										 	placeholder="10" 
										 	value={shares}
										 	onChange={(e) => setShares(e.target.value)}
										 />
										<label>shares of</label>
									</Form.Field>
									<Form.Field inline>
										<Input
											placeholder="AAPL" 
											value={ticker}
											onChange={(e) => setTicker(e.target.value.toUpperCase())}
										/>
									</Form.Field>
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
								<DeleteModal portfolioId={params.portfolioId} deletePortfolio={onDeletePortfolio} />
							</div>
						</Grid.Column>
					</Grid.Row>

				</Grid>

			</Container>

			<Footer />

		</Container>
	)
}