package org.nanohttpd.protocols.http.progress;
/** 
* @author cs
* @version 2018年1月24日 下午3:33:24
*/
public interface ProgressListener {
	 void update(long pBytesRead, long pContentLength);
	 long getBytesRead();
	 long getContentLength();
}
