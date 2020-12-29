import { Divider, Header, Segment } from 'semantic-ui-react'

export default function Footer(){
  return (
    <Segment basic textAlign='center'>
      <Divider />
      <Header size="small">
      	Disclaimer
      </Header>
      <p>
		This is an app built for fun to buy and sell fake stocks. The "transactions"
		on this platform are entirely fake, and should obviously not be used for any
		kind of investment decision.
      </p>
    </Segment>
  )
}