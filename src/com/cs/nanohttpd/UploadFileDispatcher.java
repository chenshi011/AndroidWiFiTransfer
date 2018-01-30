package com.cs.nanohttpd;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.FileChannel;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.nanohttpd.protocols.http.IHTTPSession;
import org.nanohttpd.protocols.http.NanoHTTPD;
import org.nanohttpd.protocols.http.NanoHTTPD.ResponseException;
import org.nanohttpd.protocols.http.progress.HTTPProgressSession;
import org.nanohttpd.protocols.http.response.Response;

import android.os.Environment;
import android.text.TextUtils;

/**
 * @author cs
 * @version 2018年1月19日 上午10:35:42
 */
public class UploadFileDispatcher implements IDispatcher {
	public static final String DIR_IN_SDCARD = "wifiBook";

	@Override
	public Response handle(IHTTPSession session) {
		Map<String, String> files = new HashMap<String, String>();
		try {
			session.parseBody(files);
		} catch (IOException e) {
			e.printStackTrace();
			return Response.newFixedLengthResponse("Internal Error IO Exception: " + e.getMessage());
		} catch (ResponseException e) {
			e.printStackTrace();
			return Response.newFixedLengthResponse(e.getStatus(), NanoHTTPD.MIME_PLAINTEXT, e.getMessage());
		}
		if (!files.isEmpty()) {
			if (!(session instanceof HTTPProgressSession)) {
				Map<String, List<String>> params = session.getParameters();
				for (Entry<String, List<String>> entry : params.entrySet()) {
					final String paramsKey = entry.getKey();
					final List<String> fileNames = entry.getValue();
					final String tmpFilePath = files.get(paramsKey);
					if (!TextUtils.isEmpty(tmpFilePath)) {
						String fileName = paramsKey;
						if (fileNames != null && fileNames.size() > 0) {
							fileName = fileNames.get(fileNames.size() - 1);
						}
						final File tmpFile = new File(tmpFilePath);
						File dir = new File(Environment.getExternalStorageDirectory() + File.separator + DIR_IN_SDCARD);
						if (!dir.exists()) {
							dir.mkdirs();
						}
						final File targetFile = new File(dir, fileName);
						try {
							copyFile(tmpFile, targetFile);
						} catch (IOException e) {
							e.printStackTrace();
						}
					}
				}
			}
			return Response.newFixedLengthResponse("ok");
		}
		return Response.newFixedLengthResponse("404");
	}

	@SuppressWarnings("resource")
	public static void copyFile(File src, File dst) throws IOException {
		FileChannel inChannel = new FileInputStream(src).getChannel();
		FileChannel outChannel = new FileOutputStream(dst).getChannel();
		try {
			inChannel.transferTo(0, inChannel.size(), outChannel);
		} finally {
			if (inChannel != null)
				inChannel.close();
			if (outChannel != null)
				outChannel.close();
		}
	}
}
