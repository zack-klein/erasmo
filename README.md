# erasmo

A nifty app to simulate trading stocks.

:warning: This app doesn't actually trade stocks. It just lets you build virtual portfolios. It (obviously) shouldn't be used for any kind of investment decision.

[Here's](https://www.economist.com/christmas-specials/2020/12/19/erasmuss-teachings-are-still-pertinent-today) a nice article about the real Erasmus, who this project is named for.


# Infrastructure

I iterated over the infrastructure for the backend a few times. At first I wanted to put the whole thing in AWS lambda -- I even wrote it all out (see [here](https://github.com/zack-klein/erasmo/blob/4f2c5bda0a41510a7af3c63aaded420b1d006d9e/backend/handler.py)). Unfortunately, it turned out to be a [royal PITA](https://stackoverflow.com/questions/53824556/how-to-install-numpy-and-pandas-for-aws-lambdas) to put `pandas` in a Lambda function. It's definitely possible, but because it's a pain and because Lambda was a bit of a hacky solution anyway (I was trying to put a full CRUD interface into a single microservice), I decided to go a different direction.

So, I chucked that idea and decided to use (my beloved) [Flask](https://flask.palletsprojects.com/en/1.1.x/) running on an EC2 instance instead. I wrote [this terraform module](https://github.com/zack-klein/ec2-instance) a while back that makes it possible to spin up a highly customizable, production-ready, scalable auto-scaling group in minutes. 

Normally, I would just use a load balancer from AWS to expose this EC2 instance, but my AWS bills have been annoyingly high lately, so I decided not to. Instead, I decided to run a single EC2 instance in the auto-scaling group and set up the Nginx reverse proxy (mainly for HTTPS) myself. 

Getting Nginx running properly on the EC2 instance turned out to be much more difficult than I thought it would be, but eventually it worked! In the end, I followed [this guide](https://www.digitalocean.com/community/tutorials/how-to-serve-flask-applications-with-gunicorn-and-nginx-on-centos-7) to set up Nginx with `gunicorn` on a CentOS (Amazon Linux 2) instance. Even after following this guide, though, I had **a lot** of problems getting the permissions on the socket file running the webserver right.  In the end, running Nginx as the same user that was running `gunicorn` made life so much easier (duh).  One magic line replacing the name of the user in the `nginx.conf` did the trick!

```bash
sed -i '4,6s/nginx/ec2-user/g' /etc/nginx/nginx.conf
```


 I play to follow [this guide](https://blog.miguelgrinberg.com/post/running-your-flask-application-over-https) from [the great Miguel Grinberg](https://blog.miguelgrinberg.com/) to set up HTTPS myself.

It was quite a journey, but we made it!