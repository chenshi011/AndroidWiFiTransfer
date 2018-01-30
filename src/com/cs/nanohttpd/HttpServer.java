package com.cs.nanohttpd;
/** 
* @author cs
* @version 2018年1月18日 下午7:23:55
*/

import java.io.InputStream;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.Socket;
import java.net.SocketException;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.http.conn.util.InetAddressUtils;
import org.nanohttpd.protocols.http.ClientHandler;
import org.nanohttpd.protocols.http.IHTTPSession;
import org.nanohttpd.protocols.http.NanoHTTPD;
import org.nanohttpd.protocols.http.ProgressClientHandler;
import org.nanohttpd.protocols.http.progress.ProgressListener;
import org.nanohttpd.protocols.http.request.Method;
import org.nanohttpd.protocols.http.response.Response;

public class HttpServer extends NanoHTTPD {
	private final Hashtable<Method, ArrayList<Pair>> mDispatchers;
	private ProgressListener mProgressListener;
	
	private static class Pair {
		Pattern regex;
		IDispatcher dispatcher;
	}
	
	public HttpServer(int port, ProgressListener progressListener) {
		this(null, port, progressListener);
	}
	
	public HttpServer(String hostname, int port, ProgressListener progressListener) {
		super(hostname, port);
		setTempFileManagerFactory(new UploadFileManagerFactory());
		mDispatchers = new Hashtable<Method, ArrayList<Pair>>();
		this.mProgressListener = progressListener;
	}
	
	public void setProgressListener(ProgressListener progressListener) {
		this.mProgressListener = progressListener;
	}
	
	@Override
    protected ClientHandler createClientHandler(final Socket finalAccept, final InputStream inputStream) {
        return new ProgressClientHandler(this, inputStream, finalAccept, mProgressListener);
    }
	
	public HttpServer register(Method method, String pattern, IDispatcher dispatcher) {
		Pair p = new Pair();
		p.regex = Pattern.compile("^" + pattern);
		p.dispatcher = dispatcher;
		synchronized (mDispatchers) {
			ArrayList<Pair> pairs = mDispatchers.get(method);
			if (pairs == null) {
				pairs = new ArrayList<Pair>();
				mDispatchers.put(method, pairs);
			}
			pairs.add(p);
		}
		return this;
	}

	@Override
	public Response handle(IHTTPSession session) {
		Method method = session.getMethod();
		String path = session.getUri().split("\\?")[0];
		IDispatcher match = null;
		synchronized (mDispatchers) {
			ArrayList<Pair> pairs = mDispatchers.get(method);
			if (pairs != null) {
				for (Pair p : pairs) {
					Matcher m = p.regex.matcher(path);
					if (m.matches()) {
						match = p.dispatcher;
						break;
					}
				}
			}
		}
		if (match != null) {
			return match.handle(session);
		}
		return super.handle(session);
	}
	
	@Override
	public String getHostname() {
		try {
			Enumeration<NetworkInterface> en = NetworkInterface.getNetworkInterfaces();
			while (en.hasMoreElements()) {
				NetworkInterface nif = en.nextElement();
				Enumeration<InetAddress> inet = nif.getInetAddresses();
				while (inet.hasMoreElements()) {
					InetAddress ip = inet.nextElement();
					if (!ip.isLoopbackAddress() && InetAddressUtils.isIPv4Address(ip.getHostAddress())) {
						return ip.getHostAddress();
					}
				}
			}
		} catch (SocketException e) {
		}
		return super.getHostname();
	}
}
