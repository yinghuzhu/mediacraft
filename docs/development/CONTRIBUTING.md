# MediaCraft 贡献指南

感谢您对 MediaCraft 项目的关注！我们欢迎各种形式的贡献，包括但不限于代码提交、问题报告、功能建议和文档改进。

## 🤝 如何贡献

### 报告问题
如果您发现了bug或有功能建议，请：
1. 检查是否已有相关的issue
2. 创建新的issue，详细描述问题或建议
3. 提供复现步骤（如果是bug）
4. 包含相关的环境信息

### 提交代码
1. Fork 项目到您的GitHub账户
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📋 开发规范

### 代码风格
- **Python**: 遵循 PEP 8 规范
- **JavaScript/React**: 使用 ESLint 和 Prettier
- **HTML/CSS**: 保持一致的缩进和命名
- **注释**: 为复杂逻辑添加清晰的注释

### 提交信息规范
使用清晰的提交信息格式：
```
类型(范围): 简短描述

详细描述（可选）

相关issue: #123
```

**提交类型**:
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 分支命名规范
- `feature/功能名称`: 新功能开发
- `fix/问题描述`: bug修复
- `docs/文档类型`: 文档更新
- `refactor/重构内容`: 代码重构

## 🛠️ 开发环境搭建

### 后端开发
```bash
# 克隆项目
git clone <repository-url>
cd mediacraft

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
python app.py
```

### 前端开发
```bash
# 进入前端目录
cd mediacraft-frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 系统依赖
确保系统已安装：
- Python 3.8+
- Node.js 16+
- FFmpeg
- Git

## 🧪 测试指南

### 运行测试
```bash
# 后端测试
python -m pytest tests/

# 前端测试
cd mediacraft-frontend
npm test
```

### 测试覆盖率
```bash
# 生成测试覆盖率报告
python -m pytest --cov=. tests/
```

### 测试要求
- 新功能必须包含相应的测试用例
- 确保所有测试通过
- 保持测试覆盖率在80%以上

## 📚 文档贡献

### 文档类型
- **用户文档**: 面向最终用户的使用指南
- **开发文档**: 面向开发者的技术文档
- **API文档**: 接口使用说明
- **部署文档**: 安装和部署指南

### 文档规范
- 使用Markdown格式
- 保持结构清晰，层次分明
- 包含必要的代码示例
- 及时更新过时内容

### 文档更新流程
1. 识别需要更新的文档
2. 创建或修改相关文档
3. 确保文档与代码实现一致
4. 提交Pull Request

## 🔍 代码审查

### 审查标准
- **功能性**: 代码是否实现了预期功能
- **可读性**: 代码是否清晰易懂
- **性能**: 是否有性能问题
- **安全性**: 是否存在安全隐患
- **测试**: 是否包含充分的测试

### 审查流程
1. 提交Pull Request
2. 自动化测试检查
3. 代码审查和讨论
4. 修改和完善
5. 合并到主分支

## 🎯 项目优先级

### 高优先级
- 核心功能bug修复
- 性能优化
- 安全问题修复
- 用户体验改进

### 中优先级
- 新功能开发
- 代码重构
- 文档完善
- 测试覆盖率提升

### 低优先级
- 代码风格调整
- 非关键功能优化
- 实验性功能

## 🌟 贡献者认可

我们重视每一位贡献者的努力：
- 在项目README中列出贡献者
- 在发布说明中感谢贡献者
- 为重要贡献者提供推荐信

## 📞 联系方式

如果您有任何问题或建议，可以通过以下方式联系我们：
- 创建GitHub Issue
- 发送邮件到项目维护者
- 参与项目讨论

## 📄 许可证

通过贡献代码，您同意您的贡献将在与项目相同的许可证下发布。

---

**感谢您对 MediaCraft 项目的贡献！** 🎉

每一个贡献都让这个项目变得更好，我们期待与您一起构建更优秀的视频处理工具。

---

**最后更新**: 2025年8月4日  
**维护者**: MediaCraft 开发团队