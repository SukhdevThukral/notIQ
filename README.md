# notIQ
>_an app to record ur audios of your lectures which later gets processed into notes, flashcards, tests and etc . (im not sure yet :b)_


## what ts does

so its supposed to record letures in class (even while your screen's off), and then process it by transcribing the audio via Groq API , then generated notes, flashcards, **exam hints** and flag whenever teacher says "this will be on the exam" and store everything locally on ur device :p

⚠️ WARNING: its still incomplete (as you can clearly see) but ive the vision

## demo screens: 
<img width="180" height="400" alt="image" src="https://github.com/user-attachments/assets/6308d5d4-0081-45b4-8839-fb16a7e9aae8" />
<img width="180" height="400" alt="image" src="https://github.com/user-attachments/assets/2101ae4b-bdd6-4ff1-b743-871a9399cd0f" />


## how ts was made

so this project uses [Expo](https://expo.dev) + REACT Native (SDK 57) so it runs on iOS and Android from one codebase, ive used `expo-audio` for bg lecture recording that keeps going when the screen is off (i still need to check it for processing it), `AsyncStorage` to persist all lecture data locally on device, `expo-font`  with Plus Jakarta Sans for the typography and Groq API for the AI pipeline ( its not being implemented YET)

## how to run ts locally 

```bash
git clone https://github.com/SukhdevThukral/notIQ
cd notIQ
npm install
```

then run:
```bash
npx expo start
```

after tht just scan the qr code with your Expo Go app and youre good to go!! or you can just run it on your android device from [here](https://github.com/SukhdevThukral/75Percent/releases/tag/v1.0.0)

## desg ref

ive used a dribbble [desg ref](https://dribbble.com/shots/22984346-Task-manager-app-design-mobile-app) apparently for ts :3
