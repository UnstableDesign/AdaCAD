import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { ImporttodraftService } from '../../../provider/importtodraft.service';
import { MediaService } from '../../../provider/media.service';
import { UploadService } from '../../../provider/upload.service';
import { UploadFormComponent } from './upload-form.component';

describe('UploadFormComponent', () => {
  let component: UploadFormComponent;
  let uploads: jasmine.SpyObj<UploadService>;
  let imports: jasmine.SpyObj<ImporttodraftService>;
  let media: jasmine.SpyObj<MediaService>;
  let onData: jasmine.Spy;
  let onError: jasmine.Spy;

  beforeEach(() => {
    uploads = jasmine.createSpyObj('UploadService', ['pushUpload']);
    imports = jasmine.createSpyObj('ImporttodraftService', ['uploadWif', 'uploadBitmap']);
    media = jasmine.createSpyObj('MediaService', ['loadMediaFromUpload']);
    uploads.pushUpload.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        { provide: UploadService, useValue: uploads },
        { provide: ImporttodraftService, useValue: imports },
        { provide: MediaService, useValue: media },
        { provide: HttpClient, useValue: jasmine.createSpyObj('HttpClient', ['get']) }
      ]
    });
    component = TestBed.runInInjectionContext(() => new UploadFormComponent());
    onData = spyOn(component.onData, 'emit');
    onError = spyOn(component.onError, 'emit');
  });

  function selectFiles(type: string, names: string[]): File[] {
    const selection = new DataTransfer();
    const files = names.map(name => new File(['synthetic upload'], name));
    files.forEach(file => selection.items.add(file));
    component.type = type;
    component.multiple = files.length > 1;
    component.detectFiles({ target: { files: selection.files } });
    return files;
  }

  async function finishUploads(): Promise<void> {
    // Let the upload promise chains and rejection handlers finish.
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }

  function expectSelectionCleared() {
    expect(component.selectedFiles).toBeUndefined();
    expect(component.uploading).toBe(false);
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  for (const type of ['wif', 'bitmap']) {
    it(`clears the selection after a successful ${type} upload without emitting an error`, async () => {
      const [file] = selectFiles(type, [`sample.${type === 'wif' ? 'wif' : 'bmp'}`]);
      const importer = type === 'wif' ? imports.uploadWif : imports.uploadBitmap;
      importer.and.returnValue(Promise.resolve());

      component.upload();
      expect(component.uploading).toBe(true);
      await finishUploads();

      expect(importer.calls.count()).toBe(1);
      expect(importer.calls.mostRecent().args[1]).toBe(file);
      if (type === 'bitmap') {
        expect(imports.uploadBitmap.calls.mostRecent().args[2]).toBe('bmp');
        expect(onData).toHaveBeenCalledWith(undefined);
      } else {
        expect(onData).toHaveBeenCalledWith();
      }
      expect(onData.calls.count()).toBe(1);
      expect(onError).not.toHaveBeenCalled();
      expectSelectionCleared();
    });

    it(`clears the selection and preserves the error after a failed ${type} upload`, async () => {
      selectFiles(type, [`sample.${type === 'wif' ? 'wif' : 'bmp'}`]);
      const error = new Error(`${type} upload failed`);
      const importer = type === 'wif' ? imports.uploadWif : imports.uploadBitmap;
      importer.and.returnValue(Promise.reject(error));

      component.upload();
      await finishUploads();

      expect(onError).toHaveBeenCalledWith(error);
      expect(onError.calls.count()).toBe(1);
      expect(onData).not.toHaveBeenCalled();
      expectSelectionCleared();
    });
  }

  for (const type of ['single_image', 'indexed_color_image']) {
    const mediaType = type === 'single_image' ? 'image' : 'indexed_color_image';

    it(`clears the selection after a successful ${type} upload without emitting an error`, async () => {
      const [file] = selectFiles(type, ['sample.png']);
      const uploaded = [{ id: 7 }];
      media.loadMediaFromUpload.and.returnValue(Promise.resolve(uploaded));

      component.upload();
      expect(component.uploading).toBe(true);
      await finishUploads();

      expect(uploads.pushUpload.calls.mostRecent().args[0].file).toBe(file);
      expect(media.loadMediaFromUpload).toHaveBeenCalledWith([
        { id: -1, ref: 'sample', type: mediaType, img: null }
      ]);
      expect(onData).toHaveBeenCalledWith(uploaded);
      expect(onData.calls.count()).toBe(1);
      expect(onError).not.toHaveBeenCalled();
      expectSelectionCleared();
    });

    it(`clears the selection and preserves an upload error for ${type}`, async () => {
      selectFiles(type, ['sample.png']);
      const error = new Error('image upload failed');
      uploads.pushUpload.and.returnValue(Promise.reject(error));

      component.upload();
      await finishUploads();

      expect(media.loadMediaFromUpload).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(error);
      expect(onError.calls.count()).toBe(1);
      expect(onData).not.toHaveBeenCalled();
      expectSelectionCleared();
    });

    it(`clears the selection and preserves a media error for ${type}`, async () => {
      selectFiles(type, ['sample.png']);
      const error = new Error('image loading failed');
      media.loadMediaFromUpload.and.returnValue(Promise.reject(error));

      component.upload();
      await finishUploads();

      expect(onError).toHaveBeenCalledWith(error);
      expect(onError.calls.count()).toBe(1);
      expect(onData).not.toHaveBeenCalled();
      expectSelectionCleared();
    });
  }

  it('uploads every selected WIF before clearing a multiple-file selection', async () => {
    const files = selectFiles('wif', ['first.wif', 'second.wif']);
    imports.uploadWif.and.returnValue(Promise.resolve());

    component.upload();
    expect(imports.uploadWif.calls.allArgs().map(args => args[1])).toEqual(files);
    await finishUploads();

    expect(onData.calls.count()).toBe(2);
    expect(onError).not.toHaveBeenCalled();
    expectSelectionCleared();
  });
});
