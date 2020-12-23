# erasmo

A nifty app to simulate trading stocks.

:warning: This app doesn't actually trade stocks. It just lets you build virtual portfolios. It (obviously) shouldn't be used for any kind of investment decision.

[Here's](https://www.economist.com/christmas-specials/2020/12/19/erasmuss-teachings-are-still-pertinent-today) a nice article about the real Erasmus, who this project is named for.


# Infrastructure

I iterated over the backend infrastructure a few times. At first I wanted to put the whole thing in AWS lambda -- I even wrote it all out (see [here]()). Then, it turns out it's a [royal PITA](https://stackoverflow.com/questions/53824556/how-to-install-numpy-and-pandas-for-aws-lambdas) to put `pandas` in a Lambda function. Lambda was also a bit of a hacky solution anyway since I was trying to put a full CRUD interface into a single microservice.

So, I chucked that idea and decided to use (my beloved) flask running on an EC2 instance instead. I wrote [this terraform module](https://github.com/zack-klein/ec2-instance) a while back that makes it possible to spin up a highly customizable, production-ready, scalable auto-scaling group in minutes. 

Normally, I would just use a load balancer from AWS, but my AWS bills have been annoyingly high lately, so I decided not to. Instead, I would just run a single EC2 instance and set up the Nginx reverse proxy for HTTPS myself. Getting Nginx running on the EC2 instance turned out to be more difficult than I thought it would be, though (definitely learned a lot along the way). In the end I followed [this guide](https://www.digitalocean.com/community/tutorials/how-to-serve-flask-applications-with-gunicorn-and-nginx-on-centos-7) to set up Nginx with gunicorn on a CentOS instance, and [this guide](https://blog.miguelgrinberg.com/post/running-your-flask-application-over-https) from [the great Miguel Grinberg](https://blog.miguelgrinberg.com/) to set up HTTPS myself.

It was quite a journey, but we made it!