package com.cs.nanohttpd;

import org.nanohttpd.protocols.http.tempfiles.ITempFileManager;
import org.nanohttpd.util.IFactory;

/** 
* @author cs
* @version 2018年1月19日 上午11:03:54
*/
public class UploadFileManagerFactory implements IFactory<ITempFileManager> {

	@Override
	public ITempFileManager create() {
		 return new UploadFileManager();
	}
}