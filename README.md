# open-accident-map

Offene Daten der Unfallstatistik des BKG auf einer interaktiven webbasierten Karte



## Setup System

Install dependencies which been used by this project

```
sudo apt -y install gnupg2
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor > postgresql-keyring.gpg
sudo mv postgresql-keyring.gpg /etc/apt/trusted.gpg.d/
sudo chown root:root /etc/apt/trusted.gpg.d/postgresql-keyring.gpg
sudo chmod ugo+r /etc/apt/trusted.gpg.d/postgresql-keyring.gpg
sudo chmod go-w /etc/apt/trusted.gpg.d/postgresql-keyring.gpg
echo "deb [arch=amd64, signed-by=/etc/apt/trusted.gpg.d/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
sudo apt update
sudo apt install postgis postgresql-14-postgis-3 -y
```


## Setup Database

Now get your hands dirty

```
createuser --interactive --pwprompt
createdb postgis_db -O postgis_user
psql -d postgis_db
```


## Setup Application

```
sudo apt install python3.10 virtualenv tree git jq
git clone https://github.com/p3t3r67x0/open-accident-map.git
cd open-accident-map
virtualenv venv
. venv/bin/activate
pip install -r requirements.txt
```
