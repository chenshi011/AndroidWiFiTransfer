package com.cs.androidwifitransfer;

import java.io.IOException;

import org.nanohttpd.protocols.http.progress.ProgressListener;
import org.nanohttpd.protocols.http.request.Method;

import com.cs.nanohttpd.DeviceInfoDispatcher;
import com.cs.nanohttpd.HttpServer;
import com.cs.nanohttpd.LongPollingDispatcher;
import com.cs.nanohttpd.ResourceDispatcher;
import com.cs.nanohttpd.UploadFileDispatcher;
import com.cs.nanohttpd.UploadFileProgressDispathcer;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.widget.CompoundButton;
import android.widget.CompoundButton.OnCheckedChangeListener;
import android.widget.TextView;
import android.widget.ToggleButton;

public class MainActivity extends Activity implements OnCheckedChangeListener, ProgressListener {
	private static final String TAG = MainActivity.class.getSimpleName();
	private HttpServer mHttpServer;
	private ToggleButton tb;
	private TextView status;
	private long mBytesRead;
	private long mContentLength;
	
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        mHttpServer = new HttpServer(9900, this);
        mHttpServer.register(Method.GET, "/",  new ResourceDispatcher(this))
 				  .register(Method.GET, "/images/.*",  new ResourceDispatcher(this))
 				  .register(Method.GET,"/scripts/.*",  new ResourceDispatcher(this))
 				  .register(Method.GET,"/css/.*",  new ResourceDispatcher(this))
 				  .register(Method.GET,"/imgs/.*",  new ResourceDispatcher(this))
 				  .register(Method.GET,"/js/.*",  new ResourceDispatcher(this))
 				  .register(Method.GET,"/getDeviceInfo", new DeviceInfoDispatcher(this))
 				  .register(Method.POST,"/upload", new UploadFileDispatcher())
 				  .register(Method.GET, "/upload", new UploadFileProgressDispathcer(this))
        		  .register(Method.POST, "/longpolling", new LongPollingDispatcher());
        tb = (ToggleButton)findViewById(R.id.toggleButton1);
        tb.setOnCheckedChangeListener(this);
        
        status = (TextView)findViewById(R.id.status);
    }

	@Override
	public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
		// TODO Auto-generated method stub
		if ( buttonView == tb ) {
			if ( isChecked ){
				try {
					mHttpServer.start();
					status.setText("WiFi传书已经启动，请在浏览器输入以下地址：\n http://" + mHttpServer.getHostname() + ":"
							+ mHttpServer.getListeningPort());
				} catch (IOException e) {
					e.printStackTrace();
					status.setText("WiFi传书不能启动" + e.getMessage());
				}
			} else {
				mHttpServer.stop();
				status.setText("WiFi传书已经关闭");
			}
		}
	}

	@Override
	public void update(long pBytesRead, long pContentLength) {
		Log.i(TAG, String.format("update read:%s, total:%s", pBytesRead, pContentLength));
		mBytesRead = pBytesRead;
		mContentLength = pContentLength;
	}

	@Override
	public long getBytesRead() {
		return mBytesRead;
	}

	@Override
	public long getContentLength() {
		return mContentLength;
	}
}