package com.leejanghan.aimyeoneuri

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.provider.Telephony
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsListenerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SmsListener"

    private var receiver: BroadcastReceiver? = null

    @ReactMethod
    fun startListening() {
        if (receiver != null) return
        receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
                val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
                val sender = messages.firstOrNull()?.originatingAddress ?: ""
                val body = messages.joinToString("") { it.messageBody ?: "" }
                if (body.isBlank()) return
                val params = Arguments.createMap().apply {
                    putString("sender", sender)
                    putString("body", body)
                }
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("SmsReceived", params)
            }
        }
        val filter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION).apply {
            priority = IntentFilter.SYSTEM_HIGH_PRIORITY
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactContext.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            reactContext.registerReceiver(receiver, filter)
        }
    }

    @ReactMethod
    fun stopListening() {
        receiver?.let {
            try { reactContext.unregisterReceiver(it) } catch (_: Exception) {}
            receiver = null
        }
    }

    /** NativeEventEmitter 연결에 필요 */
    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    override fun invalidate() {
        stopListening()
        super.invalidate()
    }
}
