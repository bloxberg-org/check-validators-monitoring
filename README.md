# check-validators-monitoring

A simple tool to periodically check the bloxberg validators and send them emails that are retrieved from Cobra contacts. Current setting checks if validators have been online since 3 days and runs every Monday at 13:00.

## Requirements

- nodejs
- npm

or

- Docker

## Instructions

### Install the dependencies

```
npm install
```

or run in Docker. See below.

### Get the contacts

Export the techie and consoritum contacts in the .csv format. The file from Cobra should have the following fields:

```
Haupt,Institution,Institut,Anrede,Titel,Vorname1,Nachname1,E-Mail1,Bemerkung
```

**Important** if you'll do a custom research don't forget to exclude inactive users. Always use the saved search.

There are existing settings in Cobra CRM for exporting. To do that go to the tab Recherchieren. There select Gespeicherte Recherchen. In Bereich System, choose Bloxberg Techies Monitoring. Click OK. Then in Daten tab click Exportieren. In the settings there is an ready made formatting called 'Validator Monitoring - Techies'. Choose the setting and export the file. The file name must be `bloxberg_techies.csv`.

Do the similar steps for all consortium contacts. Go to the tab Receherchieren. Click Gespeicherte Recherchen. In Bereich System, choose Bloxberg Consortium Monitoring. In Data tab click Exportieren. The formatting is call 'Validator Monitoring - Consortium'. Choose the setting and export the file. The file name must be `bloxberg_consortium.csv`.

Finally copy the files `bloxberg_techies.csv` and `bloxberg_consortium.csv` in the project root.

### Mail credentials

Copy the file `.env-template` to a new file called `.env`. Add the SMTP credentials for each variable. You can use a service like [Mailtap](https://mailtrap.io/) to test emails.

### Set the schedule

Set the cron schedule at `index.js`.

## Run

Run the script with

```
node index.js
```

## Docker

You can run the script in a lightweight container with:

```
docker-compose up
```

Run in background

```
docker-compose up -d
```

### Applying changes

If you made a change, don't forget to rebuild the container with

```
docker-compose up -d --build
```

## Logs

Logs will be written to `logs/` in winston format. Example:

```javascript
logger.log("Something happens", obj);
```

Gets saved as

```js
{
  timestamp: Date,
  level: 'info',
  message: 'Something happens',
  metadata: obj
}
```
