package com.cs.nanohttpd;

import org.json.JSONException;
import org.json.JSONObject;
import org.nanohttpd.protocols.http.IHTTPSession;
import org.nanohttpd.protocols.http.response.Response;
import org.nanohttpd.protocols.http.response.Status;

import android.content.Context;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;

/**
 * @author cs
 * @version 2018年1月18日 下午8:04:00
 */
public class DeviceInfoDispatcher extends BaseContextDispatcher {

	public DeviceInfoDispatcher(Context context) {
		super(context);
	}

	@Override
	public Response handle(IHTTPSession session) {
		return Response.newFixedLengthResponse(Status.OK, "application/json", getDeviceInfo(getWiFiName()));
	}
	
	private String getWiFiName() {
		WifiManager wifiManager = (WifiManager) mContext.getSystemService(Context.WIFI_SERVICE);
		WifiInfo wifiInfo = wifiManager.getConnectionInfo();
		if (wifiInfo != null) {
			return wifiInfo.getSSID();
		}
		return null;
	}

	private String getDeviceInfo(String networkName) {
		JSONObject jsonObject = new JSONObject();
		try {
			jsonObject.put("device_notify", "(WIFI传书，HttpServer采用NanoHTTPD实现，js上传文件结合了XmlHttpRequest、jquery.form、ajax三种方式，</br>其中XmlHttpRequest和jquery.form有交叉部分，理论可以采用query.form实现。)");
			jsonObject.put("device_desc", "当前网络：" + networkName + "</br>（传书过程中，请不要关闭电子书上的WiFi传书窗口。）");
		} catch (JSONException e) {
			e.printStackTrace();
		}
		return jsonObject.toString();
	}
}
