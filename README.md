# erasmo

A nifty app to simulate trading stocks.

![logo](./frontend/src/imgs/transparentNoText.png)

:warning: This app doesn't actually trade stocks. It just lets you build virtual portfolios. It (obviously) shouldn't be used for any kind of investment decision.

[Here's](https://www.economist.com/christmas-specials/2020/12/19/erasmuss-teachings-are-still-pertinent-today) a nice article about the real Erasmus, who this project is named for.


# Infrastructure

## Lambda woes

I iterated over the infrastructure for the backend a few times. At first I wanted to put the whole thing in AWS lambda -- I even wrote it all out (see [here](https://github.com/zack-klein/erasmo/blob/4f2c5bda0a41510a7af3c63aaded420b1d006d9e/backend/handler.py)). Unfortunately, it turned out to be a [royal PITA](https://stackoverflow.com/questions/53824556/how-to-install-numpy-and-pandas-for-aws-lambdas) to put `pandas` in a Lambda function. It's definitely possible, but because it's a pain and because Lambda was a bit of a hacky solution anyway (I was trying to put a full CRUD interface into a single microservice), I decided to go a different direction.

## Nginx woes

So, I chucked that idea and decided to use (my beloved) [Flask](https://flask.palletsprojects.com/en/1.1.x/) running on an EC2 instance instead. I wrote [this terraform module](https://github.com/zack-klein/ec2-instance) a while back that makes it possible to spin up a highly customizable, production-ready, scalable auto-scaling group in minutes. 

Normally, I would just use a load balancer from AWS to expose this EC2 instance, but my AWS bills have been annoyingly high lately, so I decided not to. Instead, I decided to run a single EC2 instance in the auto-scaling group and set up the Nginx reverse proxy (mainly for HTTPS) myself. 

Getting Nginx running properly on the EC2 instance turned out to be much more difficult than I thought it would be, but eventually it worked! In the end, I followed [this guide](https://www.digitalocean.com/community/tutorials/how-to-serve-flask-applications-with-gunicorn-and-nginx-on-centos-7) to set up Nginx with `gunicorn` on a CentOS (Amazon Linux 2) instance. Even after following this guide, though, I had **a lot** of problems getting the permissions on the socket file running the webserver right.  In the end, running Nginx as the same user that was running `gunicorn` made life so much easier (duh).  One magic line replacing the name of the user in the `nginx.conf` did the trick!

```bash
sed -i '4,6s/nginx/ec2-user/g' /etc/nginx/nginx.conf
```

## HTTPS woes

I was feeling pretty good once I finally got Nginx up and running. I followed [this guide](https://blog.miguelgrinberg.com/post/running-your-flask-application-over-https) from [the great Miguel Grinberg](https://blog.miguelgrinberg.com/) to quickly set up HTTPS myself. And it worked like a charm :partying_face:! It was actually much simpler than I was expecting it to be (it was really just running a few `certbot` commands and adding some Nginx config).  Here's a handy command to create an SSL certificate with one line:

```bash
certbot certonly \
	--webroot \
	-w <a local directory for lets encrypt verification> \
	-d <your domain name> \
	-m <your email address> \
	--agree-tos \
	--no-eff-email
```

But then I ran into another problem... what happens if I tear down my server and need to get HTTPS back up and running on a completely new machine?

(This kind of) SSL creates a certificate by going through the following:

- The certificate authority pings a special place in your domain to "test" you have full control over it
- If you pass this test, it decides it "trusts" you, and gives you a certificate
- This cert is used to encrypt traffic

There's a sneaky assumption built into this: **you must already be running on HTTP in order to create a certificate for HTTPS** (which makes perfect sense, how can they verify you if you aren't already running something on your domain). But if I'm starting from a fresh server after I've already created the certificates, I won't be running on HTTP or HTTPS, so I can't create new certificates!

This means I have to somehow get my existing certificates onto my new machine. The way I did this is a little hacky - I just stored the cert and private key in AWS Secrets Manager and recreate them on the new machine when it gets spun up. I'm sure there's a proper way to do this (the way I do it now doesn't let me renew the cert), so I'll likely update this.

*Update:* It turns out I had the right idea! According to [this](https://community.letsencrypt.org/t/move-to-another-server/77985/6) you just need to zip up the whole `letsencrypt` directory and move it around for backups. Nice!

It was quite a journey, but we made it!