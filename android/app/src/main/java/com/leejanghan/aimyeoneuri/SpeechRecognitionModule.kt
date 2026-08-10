package com.leejanghan.aimyeoneuri

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class SpeechRecognitionModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var recognizer: SpeechRecognizer? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var retryCount = 0

    override fun getName() = "NativeSpeechRecognition"

    @ReactMethod
    fun startListening() {
        retryCount = 0
        mainHandler.post { doStartListening() }
    }

    private fun doStartListening() {
        val hasPermission = ContextCompat.checkSelfPermission(
            reactContext, Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasPermission) {
            sendEvent("speechError", "PERMISSION_DENIED")
            return
        }

        recognizer?.cancel()
        recognizer?.destroy()
        recognizer = null
        recognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
        recognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onPartialResults(partial: Bundle?) {}
            override fun onEvent(eventType: Int, params: Bundle?) {}

            override fun onResults(results: Bundle?) {
                retryCount = 0
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                if (!matches.isNullOrEmpty()) {
                    sendEvent("speechResult", matches[0])
                } else {
                    sendEvent("speechError", "NO_RESULTS")
                }
            }

            override fun onError(error: Int) {
                // error 11 = ERROR_SERVER_DISCONNECTED (API 28+)
                // 첫 인식 후 서버 연결이 끊겨 재시작 시 발생 → 1회 자동 재시도
                if (error == 11 && retryCount < 1) {
                    retryCount++
                    recognizer?.destroy()
                    recognizer = null
                    mainHandler.postDelayed({ doStartListening() }, 300)
                    return
                }
                retryCount = 0
                val msg = when (error) {
                    SpeechRecognizer.ERROR_AUDIO -> "AUDIO_ERROR"
                    SpeechRecognizer.ERROR_CLIENT -> "CLIENT_ERROR"
                    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "PERMISSION_DENIED"
                    SpeechRecognizer.ERROR_NETWORK -> "NETWORK_ERROR"
                    SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "NETWORK_TIMEOUT"
                    SpeechRecognizer.ERROR_NO_MATCH -> "NO_MATCH"
                    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "RECOGNIZER_BUSY"
                    SpeechRecognizer.ERROR_SERVER -> "SERVER_ERROR"
                    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "SPEECH_TIMEOUT"
                    11 -> "SERVER_DISCONNECTED"
                    else -> "UNKNOWN_ERROR_$error"
                }
                sendEvent("speechError", msg)
            }
        })

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ko-KR")
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
        }
        recognizer?.startListening(intent)
    }

    @ReactMethod
    fun stopListening() {
        mainHandler.post {
            recognizer?.stopListening()
        }
    }

    @ReactMethod
    fun destroy() {
        mainHandler.post {
            recognizer?.destroy()
            recognizer = null
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    private fun sendEvent(eventName: String, value: String) {
        val map = Arguments.createMap().apply { putString("value", value) }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, map)
    }

    override fun onCatalystInstanceDestroy() {
        mainHandler.post {
            recognizer?.destroy()
            recognizer = null
        }
    }
}
