import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const FileUploader = ({ onFileUploaded }) => {
  const props = {
    name: 'file',
    action: 'http://localhost:3001/upload',
    accept: '.xlsx, .xls',
    showUploadList: true,
    maxCount: 1,
    onChange(info) {
      if (info.file.status === 'uploading') {
        return;
      }
      
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
        if (info.file.response && info.file.response.success) {
          onFileUploaded(info.file.response.data);
        }
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
    beforeUpload(file) {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                      file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        message.error('只能上传Excel文件!');
      }
      return isExcel || Upload.LIST_IGNORE;
    },
  };

  return (
    <Upload {...props}>
      <Button icon={<UploadOutlined />}>上传Excel文件</Button>
    </Upload>
  );
};

export default FileUploader;
