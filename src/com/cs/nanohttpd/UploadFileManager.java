package com.cs.nanohttpd;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.nanohttpd.protocols.http.tempfiles.DefaultTempFileManager;
import org.nanohttpd.protocols.http.tempfiles.ITempFile;

import android.os.Environment;
import android.text.TextUtils;

/** 
* @author cs
* @version 2018年1月19日 上午11:04:36
*/
public class UploadFileManager extends DefaultTempFileManager {
    private final File dir;
    private final List<ITempFile> files;
    public static final String DIR_IN_SDCARD = "wifiBook";
    
    public UploadFileManager() {
        this.dir = new File(Environment.getExternalStorageDirectory() + File.separator + DIR_IN_SDCARD);
        if (!dir.exists()) {
        	dir.mkdirs();
        }
        this.files = new ArrayList<ITempFile>();
    }
	@Override
	public void clear() {
		super.clear();
		this.files.clear();
	}

	@Override
	public ITempFile createTempFile(String filename_hint) throws Exception {
		if(!TextUtils.isEmpty(filename_hint)) {
			UploadFile file = new UploadFile(this.dir, filename_hint);
	        this.files.add(file);
	        return file;	
		}
		return super.createTempFile(filename_hint);
	}
}
