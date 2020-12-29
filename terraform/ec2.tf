module "backend" {
  source           = "github.com/zack-klein/ec2-instance"
  instance_name    = "erasmo"
  user_data        = file("./user-data.sh")
  vpc_id           = "vpc-792b4b03"
  subnets          = ["subnet-bc9fcee0", "subnet-21237746", "subnet-7b91c255"]
  ssh_public_key   = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCBIu48ryZCZZlufVF9AgjBrEmjau3Hmb20Aah75SYQTAhA5+9E5MuXJ1UwlDBXUPDIv/VFgu+/AmyT1kk1+8N9OE8I2kVcr8nAsFV7c7PNG60zxMXtCiCA8KgzQw/JeUceCmSZnGTCY5pgkXFvTAVaPtNywaEuKU9sICi+J+jm6WBk+IbX+GQYCJCTjGugbH0SOqivyBj/xiVgXQAdDKybvSQkWZqlERnfpbI0vSGEVqzlia+D54TlxaL5tnI76KoR6toWBmp81Y4JVHNAMW7LMerbQuor9gEUWWY1pdY/NikY9Sy1YMPOiYtAqbi/x3rm03tsr1mEAsu7o29g+oID"
  instance_profile = aws_iam_instance_profile.profile.name
  public           = true
  instance_type    = "t3.nano"
}