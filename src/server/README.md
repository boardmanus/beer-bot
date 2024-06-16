# Beer-Bot Server

The beer-bot server has three responsibilities:

- recieves ibeacon tilt measurements from the Tilt instrument
- logs tilt measurements to the cloud
- serves the beer-bot webapp displaying the Tilt information

## Cloud App for Logging Tilt Data

To allow beer-bot to send measurements to the cloud, beer-bot relies
on the Tilt Cloud App for iOS/Android/Tilt Pi. This support sets up a
google sheet that contains a an App Script that facilitates storing the
measurements in the spreadshet. The original sheet (which should be
copied) can be found here:

[Tilt Spreadsheet](https://docs.google.com/spreadsheets/d/1ut1wClRrowkYRYm6yQAVuc_Q568stncawv1EuYez2go/edit?gid=435145506#gid=435145506)

It provides instructions on how to set things up.

### Cloud Authorization

The downside to this approach is that it requires several authorizations
to allow the App Script to modify the sheet for the beer. To do this, you need
to follow instructions inside the App Script, which are repeated here:

    For Google Sheets to receive data from the Tilt app
    deploy script as web app from the "Publish" menu and set permissions. Note that you are now the owner and "developer" of the app.

    1) Got to "Publish" menu and select "Deploy as web app..."

    2) In the dialog box, set "Who has access to the app:" to "Anyone, even anonymous" and click "Deploy".

    3) A dialog box will appear. Select "Review Permissions". Another dialog box will appear. Select your Google Account.

    4) A dialog box with "This app isn't verified" will appear. Select "Advanced" then select "Go to Tilt Cloud Template for Tilt App 1.6+ (unsafe)"

    5) A dialog box with permission requests will appear. Select "Allow".

    6) A dialog box confirming the app has been published will appear. Note: Do NOT use the cloud URL shown in the dialog, see next step.

    7) Close Google Scripts tab and return to Google Sheets. Use the new "Tilt" menu to email yourself the cloud URL.

The Google permissions give way more permissions that desired :(
