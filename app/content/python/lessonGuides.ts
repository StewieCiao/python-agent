export type LessonGuideSection = {
  kind: "概念入门" | "逐步拆解" | "常见误区";
  title: string;
  body: string;
  example: string;
  bullets: string[];
};

export const lessonGuides: Record<string, LessonGuideSection[]> = {
  "first-output": [
    {
      kind: "概念入门",
      title: "程序怎样产生一行输出",
      body: "Python 会从文件第一行开始，按顺序执行每条语句。print() 是一个已经由 Python 提供的函数：括号里放什么值，它就把这个值显示到输出区域；每调用一次，默认换一行。引号包住的是字符串，也就是一段原样保存的文字。",
      example: `print("你好")
print("第二行")`,
      bullets: ["print 是函数名", "圆括号里是交给函数的值", "英文引号必须成对出现"],
    },
    {
      kind: "逐步拆解",
      title: "先计算，再交给 print",
      body: "括号里不仅能写文字，也能写表达式。执行 print(8 * 7) 时，Python 先读取 8 * 7，使用 * 完成乘法得到 56，然后才调用 print(56)。因此输出里只会看到结果，不会看到表达式本身。",
      example: `print(8 * 7)  # 先算出 56，再输出`,
      bullets: ["* 表示乘法", "# 后面是注释，不会执行", "代码的第二个 print 对应输出的第二行"],
    },
    {
      kind: "常见误区",
      title: "文字、数字和标点不要混用",
      body: "print(56) 输出数字 56，print(\"56\") 输出文字 56，屏幕上看起来相同，但类型不同。本关还要求亲自写乘法表达式，因此直接写 print(56) 虽然结果相同，也没有完成练习目标。",
      example: `print(56)       # 数字
print("56")     # 字符串
print(8 * 7)    # 本关需要的表达式`,
      bullets: ["不要使用中文引号或中文括号", "不要在最前面多输出空行", "每一行输出都来自一次 print 调用"],
    },
  ],
  variables: [
    {
      kind: "概念入门",
      title: "变量是值的名字",
      body: "变量让我们给数据起一个可读的名字。执行 name = \"小派\" 后，名字 name 指向字符串“小派”；执行 level = 1 后，level 指向整数 1。等号在这里表示赋值：先计算右边，再把结果交给左边的名字。",
      example: `name = "小派"
level = 1`,
      bullets: ["字符串需要引号", "整数不需要引号", "变量名应表达数据含义"],
    },
    {
      kind: "逐步拆解",
      title: "用 f-string 把变量放进句子",
      body: "字符串前面的 f 表示这是一条格式化字符串。Python 会找到花括号里的变量，取出当前值，再把值放回句子。{name} 变成“小派”，{level} 变成 1，最后得到完整文本。",
      example: `print(f"{name}正在挑战第 {level} 关")`,
      bullets: ["f 必须写在开引号前", "花括号里写变量名，不加引号", "句子原有空格会被保留"],
    },
    {
      kind: "常见误区",
      title: "赋值、比较与类型是三件事",
      body: "name = \"小派\" 是保存值，不是在询问两个值是否相等；比较相等使用 ==。level = \"1\" 会得到字符串而不是整数，即使输出看起来一样，后续数学运算也会不同。",
      example: `level = 1      # 整数，可以参与计算
level = "1"    # 字符串，只是一段文字`,
      bullets: ["不要把变量名写进引号", "不要漏掉 f-string 的 f", "按题目精确保留文字中的空格"],
    },
  ],
  strings: [
    {
      kind: "概念入门",
      title: "字符串方法会返回新字符串",
      body: "字符串是由字符组成的不可变数据。strip() 删除开头和结尾的空白，lower() 把英文字母转成小写；它们不会原地改写原字符串，而是各自返回一个新结果。",
      example: `raw = "  PyThOn  "
clean = raw.strip()
lowered = clean.lower()`,
      bullets: ["空格也属于字符", "方法通过点号调用", "原始变量 raw 仍保持不变"],
    },
    {
      kind: "逐步拆解",
      title: "从左到右阅读方法链",
      body: "text.strip().lower() 可以拆成两步理解：先执行 text.strip() 得到去除首尾空白的字符串，再对这个中间结果调用 lower()。函数最后用 return 把处理结果交给调用者。",
      example: `def normalize_title(text):
    return text.strip().lower()`,
      bullets: ["text 是参数，代表传入的任意文本", "先 strip，再 lower", "return 决定函数的最终结果"],
    },
    {
      kind: "常见误区",
      title: "调用方法后要接住结果",
      body: "只写 text.strip() 然后 return text，会把原字符串返回，因为 strip() 的新结果没有被保存或直接返回。strip() 也只清理两端，不会删除单词中间的空格。",
      example: `text.strip()   # 结果被丢弃
return text    # 仍然返回原值`,
      bullets: ["不要用 replace 删除所有空格", "不要忘记方法后的圆括号", "函数应返回结果，而不是只 print"],
    },
  ],
  branches: [
    {
      kind: "概念入门",
      title: "条件让程序选择路径",
      body: "比较表达式会得到 True 或 False。if 后面的条件为 True 时，缩进的代码才会执行；条件为 False 时，Python 会继续检查下一条路径。分数区间可以通过从低到高设置边界来表达。",
      example: `if score < 60:
    return "C"`,
      bullets: ["< 表示小于", "冒号表示下面开始一个代码块", "同一代码块必须保持相同缩进"],
    },
    {
      kind: "逐步拆解",
      title: "return 会立即结束函数",
      body: "如果 score 是 55，第一个条件成立并返回 C，函数到此结束。若 score 是 75，第一个条件不成立，程序继续检查 score < 90 并返回 B。只有前两次都没有返回时，才执行最后的 return A。",
      example: `def grade(score):
    if score < 60:
        return "C"
    if score < 90:
        return "B"
    return "A"`,
      bullets: ["55 走第一条路径", "75 走第二条路径", "95 落到最后一条路径"],
    },
    {
      kind: "常见误区",
      title: "边界值属于哪个区间要说清楚",
      body: "score < 60 不包含 60，所以 60 会继续进入 B 区间；score < 90 不包含 90，所以 90 最终得到 A。写条件时应专门代入 59、60、89、90 检查边界。",
      example: `59 → C
60 → B
89 → B
90 → A`,
      bullets: ["不要把 < 和 <= 随意互换", "不要遗漏兜住剩余情况的返回值", "分支结构不必拘泥于唯一写法"],
    },
  ],
  loops: [
    {
      kind: "概念入门",
      title: "for 循环逐个读取集合",
      body: "for number in numbers 会从列表 numbers 中依次取出每个元素，并在本轮循环中把它命名为 number。循环体的缩进代码会为每个元素执行一次，适合处理数量不固定的数据。",
      example: `for number in [2, 3, 4]:
    print(number)`,
      bullets: ["number 是当前元素", "numbers 是要遍历的集合", "循环次数由元素数量决定"],
    },
    {
      kind: "逐步拆解",
      title: "用累加器保存阶段结果",
      body: "total 从 0 开始。每遇到一个偶数，就执行 total += number，也就是把当前数字加到旧 total 上并保存新值。% 是取余运算；一个整数除以 2 的余数为 0，就说明它是偶数。",
      example: `total = 0
for number in numbers:
    if number % 2 == 0:
        total += number
return total`,
      bullets: ["先初始化 total", "循环中只累计偶数", "循环全部结束后再 return"],
    },
    {
      kind: "常见误区",
      title: "缩进位置会改变执行次数",
      body: "如果把 total = 0 放进循环，每一轮都会清空之前的结果；如果把 return 放进循环，函数处理第一个元素后就提前结束。两者都无法得到完整集合的总和。",
      example: `for number in numbers:
    total = 0      # 错：每轮重置
    return total   # 错：第一轮就结束`,
      bullets: ["累加器在循环前创建", "return 与 for 对齐", "空列表应自然得到 0"],
    },
  ],
  functions: [
    {
      kind: "概念入门",
      title: "函数把规则包装成可重复能力",
      body: "def 定义一个函数，price 和 member 是参数，代表调用时才会传入的数据。函数内部只关心规则，不需要提前知道具体订单。return 把计算结果交还调用者，也会立即结束本次调用。",
      example: `def shipping_fee(price, member):
    return 10`,
      bullets: ["定义函数时写参数", "调用函数时传入实际值", "返回值可以继续参与其他计算"],
    },
    {
      kind: "逐步拆解",
      title: "把业务规则翻译成布尔表达式",
      body: "会员免运费，或者价格达到 99 也免运费。or 表示两项条件至少一项为 True，整个条件就成立。因此 member or price >= 99 为真时返回 0，否则返回 10。",
      example: `if member or price >= 99:
    return 0
return 10`,
      bullets: ["member 本身就是布尔值", ">= 99 包含恰好 99", "普通且未满 99 才收费"],
    },
    {
      kind: "常见误区",
      title: "print 不是 return",
      body: "print(0) 只是把 0 显示出来，调用者拿不到结果；return 0 才把数字交回去。本关函数不应产生额外输出，因为运费是供其他程序使用的数据。",
      example: `fee = shipping_fee(80, False)
# fee 应得到 10，而不是 None`,
      bullets: ["不要在函数中调试性 print", "测试会员、99 边界和普通订单", "每条路径都要返回数字"],
    },
  ],
  lists: [
    {
      kind: "概念入门",
      title: "列表推导式是生成列表的紧凑写法",
      body: "列表推导式把遍历、筛选和转换写在一对方括号里。基本结构是：[要放入结果的值 for 当前元素 in 原列表 if 保留条件]。它最终创建并返回一个新列表。",
      example: `[score + 5 for score in scores if score >= 60]`,
      bullets: ["for 负责逐个读取", "if 决定是否保留", "最左侧表达式决定新元素"],
    },
    {
      kind: "逐步拆解",
      title: "先筛选，再加分，最后封顶",
      body: "每个 score 先经过 score >= 60 的筛选；通过后计算 score + 5。min(score + 5, 100) 会取两个数字中较小的一个，所以 98 加分后不会超过 100。",
      example: `def improve_scores(scores):
    return [
        min(score + 5, 100)
        for score in scores
        if score >= 60
    ]`,
      bullets: ["59 被过滤", "60 变成 65", "98 和 100 都封顶为 100"],
    },
    {
      kind: "常见误区",
      title: "筛选条件不是加分条件",
      body: "if score >= 60 控制元素是否进入结果，而不是控制是否加分。如果把条件写在错误位置，可能保留不及格分数，或只给一部分合格分数加分。",
      example: `# 阅读顺序：
# 从 scores 取 score → 合格才保留 → 加 5 并封顶`,
      bullets: ["结果必须是列表", "不要修改传入的原列表", "空输入应得到空列表"],
    },
  ],
  dictionaries: [
    {
      kind: "概念入门",
      title: "字典用键查找对应的值",
      body: "字典把数据保存为 key: value。单词计数中，单词适合作为键，出现次数作为值。键不能重复；再次给同一个键赋值会更新它对应的次数。",
      example: `counts = {"py": 2, "go": 1}
print(counts["py"])  # 2`,
      bullets: ["花括号创建字典", "键和值用冒号连接", "通过方括号按键取值"],
    },
    {
      kind: "逐步拆解",
      title: "get 为第一次出现提供默认值",
      body: "第一次遇到某个 word 时，字典里还没有这个键。counts.get(word, 0) 会在键不存在时返回 0；加 1 后保存为第一次计数。以后再遇到同一单词，就读取旧次数并继续加 1。",
      example: `for word in words:
    counts[word] = counts.get(word, 0) + 1`,
      bullets: ["未知单词从 0 开始", "右侧先读取旧值", "左侧再写回新值"],
    },
    {
      kind: "常见误区",
      title: "不要提前写死可能出现的键",
      body: "输入可以包含任何单词，因此不能只创建 py、go、js 三个固定键。直接读取 counts[word] 也会在第一次出现时触发 KeyError，除非先判断或使用 get。",
      example: `counts = {}             # 从空字典开始
old = counts.get(word, 0)`,
      bullets: ["针对未知输入编写规则", "空输入返回空字典", "不要把整个列表当成一个键"],
    },
  ],
  exceptions: [
    {
      kind: "概念入门",
      title: "异常是程序报告失败的方式",
      body: "int(text) 尝试把输入转换成整数。像 \"18\" 这样的文本能成功，像 \"十八\" 会抛出 ValueError。try/except 让函数只对已知、可处理的失败作出回应，而不是让程序直接中断。",
      example: `try:
    age = int(text)
except ValueError:
    age = None`,
      bullets: ["try 放可能失败的操作", "except 写准备处理的异常类型", "正常路径不会进入 except"],
    },
    {
      kind: "逐步拆解",
      title: "只捕获输入格式错误",
      body: "本关只知道如何处理“文本不是整数”这一种情况，所以只捕获 ValueError 并返回 None。若对象自身行为错误并抛出 TypeError，函数没有处理方案，应让它继续向外传播，方便调用者看到真实问题。",
      example: `def parse_age(text):
    try:
        return int(text)
    except ValueError:
        return None`,
      bullets: ["成功时直接返回整数", "ValueError 时返回 None", "其他异常保留真实类型"],
    },
    {
      kind: "常见误区",
      title: "捕获越宽，不代表程序越安全",
      body: "except Exception 或不写异常类型的 bare except 会把代码错误也伪装成普通输入问题，导致真正的 bug 难以发现。try 代码块也应尽量小，只包住确实可能发生预期异常的语句。",
      example: `except Exception:  # 太宽，会隐藏未知错误
    return None`,
      bullets: ["接受 except ValueError 和 except (ValueError)", "不要捕获 BaseException", "不要静默吞掉未知错误"],
    },
  ],
  classes: [
    {
      kind: "概念入门",
      title: "类描述对象拥有的数据和行为",
      body: "class Wallet 定义一种“钱包”对象。每次调用 Wallet() 都创建一个独立实例；__init__ 在创建时运行，用来设置初始状态。self 代表当前这个实例，self.balance 就是它自己的余额。",
      example: `class Wallet:
    def __init__(self):
        self.balance = 0`,
      bullets: ["类是对象的设计说明", "实例是按说明创建的具体对象", "不同实例拥有各自的 balance"],
    },
    {
      kind: "逐步拆解",
      title: "方法读取并更新对象状态",
      body: "deposit 是实例方法，第一个参数必须接收 self。合法存款时，self.balance += amount 会基于旧余额计算新余额并保存；方法返回更新后的余额，让调用者知道本次操作结果。",
      example: `def deposit(self, amount):
    self.balance += amount
    return self.balance`,
      bullets: ["连续存款会持续累加", "状态保存在实例上", "return 返回最新余额"],
    },
    {
      kind: "常见误区",
      title: "先验证，再修改状态",
      body: "零和负数都不是有效存款，必须在更新 balance 之前抛出 ValueError。若先修改再报错，对象已经进入错误状态；只拒绝 0 也会让负数悄悄减少余额。",
      example: `if amount <= 0:
    raise ValueError("amount must be positive")`,
      bullets: ["<= 0 同时覆盖零和负数", "非法操作不改变余额", "不要把 balance 写成所有实例共享的全局变量"],
    },
  ],
  generators: [
    {
      kind: "概念入门",
      title: "生成器按需要逐个产生值",
      body: "普通函数用 return 一次返回最终结果；生成器包含 yield，每次 yield 一个值后暂停，下一次迭代再从暂停处继续。它不会先创建完整列表，适合处理大量或无限序列。",
      example: `def numbers():
    yield 1
    yield 2`,
      bullets: ["调用生成器函数得到生成器对象", "迭代时才真正执行", "yield 后函数状态会被保留"],
    },
    {
      kind: "逐步拆解",
      title: "用 range 生成不超过上限的偶数",
      body: "range(0, limit + 1, 2) 从 0 开始，每次增加 2。range 的结束值不包含在结果中，因此写 limit + 1 才能在 limit 本身为偶数时把它包含进来。for 循环再逐个 yield。",
      example: `def even_numbers(limit):
    for number in range(0, limit + 1, 2):
        yield number`,
      bullets: ["上限 0 得到 0", "上限 5 得到 0、2、4", "负数上限自然不产生值"],
    },
    {
      kind: "常见误区",
      title: "返回列表不等于生成器",
      body: "return [0, 2, 4] 会立即创建并返回列表，函数也不是生成器。仅在注释或字符串中写 yield 同样不会改变函数行为；yield 必须位于实际执行路径中。",
      example: `def wrong(limit):
    return [0, 2, 4]  # 列表函数，不是生成器`,
      bullets: ["不要硬编码固定结果", "注意 range 不包含结束值", "生成器通常通过 list(...) 查看全部结果"],
    },
  ],
  decorators: [
    {
      kind: "概念入门",
      title: "函数也可以被传入和返回",
      body: "Python 中函数是一种值，可以作为参数交给另一个函数。装饰器接收原函数，创建一个包装函数 wrapper，再返回 wrapper。使用 @twice 后，调用原名字实际上会进入包装函数。",
      example: `def twice(func):
    def wrapper():
        func()
        return func()
    return wrapper`,
      bullets: ["func 保存原函数", "wrapper 增加调用逻辑", "返回 wrapper 时不要加圆括号"],
    },
    {
      kind: "逐步拆解",
      title: "完整转发位置参数和关键字参数",
      body: "*positional 收集所有位置参数，**named 收集所有关键字参数。调用 func(*positional, **named) 会按原样展开并转交，包装器因此能支持不同参数签名的函数。第一次结果忽略，第二次结果通过 return 返回。",
      example: `def wrapper(*positional, **named):
    func(*positional, **named)
    return func(*positional, **named)`,
      bullets: ["* 收集和展开位置参数", "** 收集和展开关键字参数", "两次调用收到完全相同的参数"],
    },
    {
      kind: "常见误区",
      title: "调用两次还要返回正确结果",
      body: "只调用两次但不 return，会让装饰后的函数得到 None。只支持 *args 会在关键字调用时失败。参数变量叫什么并不重要，重要的是 * 和 ** 的收集、转发语义。",
      example: `@twice
def add(a, b=0):
    return a + b

add(2, b=3)`,
      bullets: ["不要提前执行并返回 func() 作为装饰器结果", "保留关键字参数", "返回第二次调用值"],
    },
  ],
  "project-text": [
    {
      kind: "概念入门",
      title: "把文本处理拆成数据流水线",
      body: "真实文本任务通常不是一步完成，而是依次经历标准化、分词、统计和汇总。先用 lower() 统一大小写，再用 split() 按空白切成单词列表，后续统计才不会把 Python 和 python 当成不同词。",
      example: `words = text.lower().split()`,
      bullets: ["输入是原始字符串", "中间结果是单词列表", "最终结果用字典表达多个指标"],
    },
    {
      kind: "逐步拆解",
      title: "一次统计复用多个结果",
      body: "循环构建 counts 后，len(words) 是总词数，len(counts) 是不同单词数。max(counts, key=counts.get) 会比较每个键对应的次数，找出频次最高的键；空字典不能调用 max，所以空输入单独得到 None。",
      example: `top = max(counts, key=counts.get) if counts else None
return {"words": len(words), "unique": len(counts), "top": top}`,
      bullets: ["同频时采用字典中先出现的词", "空文本得到 0、0、None", "键名按题目保持固定"],
    },
    {
      kind: "常见误区",
      title: "先确定中间数据，再组织返回结构",
      body: "边遍历边反复 split 或 lower 会让步骤难以验证。先得到 words，再得到 counts，最后一次组装返回字典，能让每一步都容易打印检查，也减少重复工作。",
      example: `# 1. words
# 2. counts
# 3. summary dictionary`,
      bullets: ["不要只针对一个固定句子写答案", "不要忘记空输入", "返回完整字典而不是只返回 top"],
    },
  ],
  "project-expense": [
    {
      kind: "概念入门",
      title: "同时计算总量和分组汇总",
      body: "每条记录包含 category 和 amount。项目需要两个累积结果：total 保存全部金额，by_category 字典保存每类金额。由于两项都依赖同一条记录，可以在同一个 for 循环里同步更新。",
      example: `total = 0
by_category = {}
for record in records:
    total += record["amount"]`,
      bullets: ["record 是一条字典记录", "总额是一个数字", "分组结果是嵌套在返回值中的字典"],
    },
    {
      kind: "逐步拆解",
      title: "每轮同时更新两个累加器",
      body: "先从 record 取出 category 和 amount。amount 加入 total；同一 amount 还要加入对应分类的旧金额。get(category, 0) 处理这个分类第一次出现的情况。循环结束后统一返回两个结果。",
      example: `category = record["category"]
amount = record["amount"]
total += amount
by_category[category] = by_category.get(category, 0) + amount`,
      bullets: ["每条记录只处理一次", "新分类从 0 开始", "空列表返回零和空字典"],
    },
    {
      kind: "常见误区",
      title: "一次遍历意味着不再偷偷扫描第二遍",
      body: "一个 for 循环之外再写列表、字典或生成器推导式，本质上仍会再次遍历 records。本关要求在一个 for 中完成两项汇总，是为了训练流式处理思维。",
      example: `# 不要再写：
total = sum(record["amount"] for record in records)`,
      bullets: ["不要写死示例分类", "不要依赖记录一定非空", "金额计算和分组必须来自同一批真实记录"],
    },
  ],
  "project-tasks": [
    {
      kind: "概念入门",
      title: "先验证数据，再进行排序",
      body: "任务优先级只允许 1 到 5。排序之前先遍历所有任务验证范围，可以避免非法数据悄悄进入计划。发现任何非法值就抛出 ValueError，提醒调用者先修正输入。",
      example: `for task in tasks:
    if task["priority"] not in range(1, 6):
        raise ValueError("priority must be 1-5")`,
      bullets: ["range(1, 6) 包含 1 到 5", "0 和 6 都必须拒绝", "验证失败时不返回部分结果"],
    },
    {
      kind: "逐步拆解",
      title: "元组排序键表达两层规则",
      body: "sorted 会按 key 返回的元组从左到右比较。优先级要从高到低，所以使用负数 -priority；同优先级再按 name 正常升序。排序后只提取任务名称。",
      example: `ordered = sorted(
    tasks,
    key=lambda task: (-task["priority"], task["name"]),
)`,
      bullets: ["先比较负优先级", "相同后再比较名称", "sorted 不修改原列表"],
    },
    {
      kind: "常见误区",
      title: "reverse=True 会把所有规则一起反转",
      body: "若用 reverse=True，名称也会变成降序，无法表达“优先级降序、名称升序”的组合规则。把只需反向的数字变成负数更精确。",
      example: `(-5, "A") < (-5, "B")
# 所以优先级 5 时 A 排在 B 前`,
      bullets: ["空输入应返回空列表", "同级排序规则必须稳定", "不要只检查下界而漏掉上界"],
    },
  ],
  "agent-tool-registry": [
    {
      kind: "概念入门",
      title: "Agent 工具本质上是可查找的函数",
      body: "模型只能产生文字意图，真正查询天气、计算或读取数据需要调用程序函数。ToolRegistry 用字典把工具名称映射到函数对象，让 Agent 能根据 action 中的名字找到可执行能力。",
      example: `registry.tools = {
    "weather": weather_function,
}`,
      bullets: ["键是协议中的工具名", "值是函数本身，不是函数结果", "注册和执行是两个不同阶段"],
    },
    {
      kind: "逐步拆解",
      title: "payload 通过关键字参数进入工具",
      body: "execute 收到工具名和 payload 字典。self.tools[name] 先取出函数，(**payload) 再把字典展开成关键字参数。例如 {\"city\": \"杭州\"} 会变成 city=\"杭州\"。",
      example: `def execute(self, name, payload):
    return self.tools[name](**payload)`,
      bullets: ["先查函数，再调用", "工具返回值原样交回 Agent", "未知名称自然产生 KeyError"],
    },
    {
      kind: "常见误区",
      title: "重复注册会让行为变得不可预测",
      body: "同名工具若被静默覆盖，Agent 看到相同名字却可能执行不同函数。因此 register 应在写入前检查名称，重复时明确抛出 ValueError。",
      example: `if name in self.tools:
    raise ValueError("duplicate tool")`,
      bullets: ["不要伪造默认工具结果", "不要吞掉未知工具错误", "payload 的键必须匹配工具参数"],
    },
  ],
  "agent-action-parser": [
    {
      kind: "概念入门",
      title: "解析器把模型文本变成结构化动作",
      body: "Agent 常约定模型输出 tool[payload]。解析器的任务不是执行工具，而是把一段文本拆成动作名和载荷两个值，例如 weather[杭州] 变成 (\"weather\", \"杭州\")。Finish[...] 也使用相同协议。",
      example: `"weather[杭州]" → ("weather", "杭州")`,
      bullets: ["协议规定开头是动作名", "方括号内是载荷", "解析与执行保持分离"],
    },
    {
      kind: "逐步拆解",
      title: "只在第一个左方括号处分割",
      body: "先 strip 清理整段文本两端空白，再确认存在 [ 且最后一个字符是 ]。去掉末尾 ] 后，用 split(\"[\", 1) 只切一次，这样 payload 内即使还有方括号也能完整保留。",
      example: `name, payload = text[:-1].split("[", 1)`,
      bullets: ["[:-1] 去掉最后一个 ]", "第二个参数 1 限制分割次数", "载荷可以包含换行"],
    },
    {
      kind: "常见误区",
      title: "格式不完整时不要猜测",
      body: "缺少动作名、左括号或结尾右括号时，解析器无法可靠判断意图，应明确返回 (None, None)。不要自动补括号或把任意文本当成可执行动作。",
      example: `"[杭州]"      → (None, None)
"weather杭州"  → (None, None)`,
      bullets: ["空动作名无效", "必须以右方括号结尾", "无法解析不等于工具执行失败"],
    },
  ],
  "agent-react-loop": [
    {
      kind: "概念入门",
      title: "ReAct 用动作和观察推进任务",
      body: "ReAct 的核心循环是：模型提出 Action，系统执行工具得到 Observation，再把观察结果加入历史供下一步判断。本练习用预先给出的 actions 模拟模型输出，重点理解 Agent 的控制循环。",
      example: `Action: weather[杭州]
Observation: 晴
Action: Finish[适合出游]`,
      bullets: ["Action 是下一步操作", "Observation 是真实工具结果", "history 保存可追踪过程"],
    },
    {
      kind: "逐步拆解",
      title: "每一步都解析、执行并记录",
      body: "循环最多处理 max_steps 个 action。若动作名是 Finish，payload 就是最终答案并立即返回；否则按名称查工具、传入 payload、获取 observation，再把三个字段组成一条历史记录。",
      example: `observation = tools[name](payload)
history.append({
    "action": name,
    "input": payload,
    "observation": observation,
})`,
      bullets: ["steps 记录实际处理次数", "Finish 不调用普通工具", "达到上限仍未 Finish 时 answer 为 None"],
    },
    {
      kind: "常见误区",
      title: "不要把计划当成已经执行的结果",
      body: "history 中的 observation 必须来自真实工具调用，不能直接复制 action 或写死样例。未知工具也不应伪造成成功，应保留 KeyError，让调用链知道配置缺失。",
      example: `tools[name](payload)  # 名称不存在时暴露真实错误`,
      bullets: ["限制步数防止无限循环", "保留动作原始顺序", "不要在未遇到 Finish 时编造答案"],
    },
  ],
  "agent-plan-solve": [
    {
      kind: "概念入门",
      title: "先规划，把大任务拆成小步骤",
      body: "Plan-and-Solve 先生成有顺序的步骤，再逐个执行。每个步骤拥有 id 和 task；前面步骤的结果会进入 context，后续步骤因此可以使用已经获得的信息。",
      example: `steps = [
    {"id": "weather", "task": "查询天气"},
    {"id": "advice", "task": "生成建议"},
]`,
      bullets: ["plan 描述做事顺序", "solve 负责真正执行", "context 连接前后步骤"],
    },
    {
      kind: "逐步拆解",
      title: "执行后再更新上下文",
      body: "每轮把 step 的 task 和当前 context 交给 executor。得到 result 后，先按统一结构加入 results，再使用 step id 把结果写入 context，下一轮便能看到它。传 context.copy() 防止执行器意外修改主上下文。",
      example: `result = executor(step["task"], context.copy())
results.append({"id": step["id"], "result": result})
context[step["id"]] = result`,
      bullets: ["第一步看到空 context", "第二步看到第一步结果", "结果顺序与计划顺序一致"],
    },
    {
      kind: "常见误区",
      title: "不能把未来结果提前放进 context",
      body: "上下文只应包含已经完成的步骤。如果先把占位值写入，执行器会误以为未来信息已经可用。也不要把同一个可变 context 直接交给外部执行器，否则它可能破坏调度状态。",
      example: `executor(task, context.copy())  # 给快照，不交出主对象`,
      bullets: ["空计划返回空列表", "不要重排步骤", "id 是结果进入上下文的键"],
    },
  ],
  "agent-reflection": [
    {
      kind: "概念入门",
      title: "反思循环把评估和改进分开",
      body: "Reflection 模式先让 evaluate 判断当前 draft 是否达标；未达标时再调用 revise 生成改进稿。把评估和修改分成两个函数，便于替换标准，也能记录每轮质量变化。",
      example: `if evaluate(draft):
    return draft
draft = revise(draft)`,
      bullets: ["draft 是当前版本", "evaluate 返回布尔值", "revise 返回下一版内容"],
    },
    {
      kind: "逐步拆解",
      title: "每轮先评估，合格立即停止",
      body: "for 循环最多运行 max_rounds 次。每轮第一件事是评估；如果已经合格就直接 return，避免不必要的改写。只有不合格才 revise，并把新版本保存回 draft，供下一轮继续评估。",
      example: `for _ in range(max_rounds):
    if evaluate(draft):
        return draft
    draft = revise(draft)
return draft`,
      bullets: ["早停保护已合格结果", "达到上限返回最后版本", "max_rounds=0 时不做评估或修改"],
    },
    {
      kind: "常见误区",
      title: "轮数是边界，不是成功保证",
      body: "达到最大轮数只能说明预算用完，并不代表内容已经合格，因此不能伪造成功状态。负数轮数没有合理语义，应在循环前明确抛出 ValueError。",
      example: `if max_rounds < 0:
    raise ValueError("max_rounds must be non-negative")`,
      bullets: ["不要先修改再评估", "不要超过轮数上限", "没有合格时如实返回最终草稿"],
    },
  ],
  "agent-memory-retrieval": [
    {
      kind: "概念入门",
      title: "记忆检索先把相关内容找回来",
      body: "Agent 不会每次都把全部历史放进上下文，而是根据当前 query 选出相关记忆。本关使用关键词重叠作为相关度，再用 importance 作为第二排序条件，模拟最小可解释的检索器。",
      example: `query: "python error"
memory: "fix python error"
overlap: 2`,
      bullets: ["相关度来自共享关键词数量", "importance 表示记忆的重要程度", "limit 限制放回上下文的数量"],
    },
    {
      kind: "逐步拆解",
      title: "统一大小写、去重，再计算交集",
      body: "lower().split() 把文本变成小写单词，set 去掉重复词。两个集合使用 & 得到交集，len 就是重叠数量。只保留 overlap 大于 0 的记忆，并按相关度降序、重要度降序、原位置升序排列。",
      example: `overlap = len(query_words & content_words)
scored.sort(key=lambda item: (-item[0], -item[1], item[2]))`,
      bullets: ["负号实现数字降序", "原 index 保证同分时顺序稳定", "最终只返回 content 文本"],
    },
    {
      kind: "常见误区",
      title: "无相关结果时应返回空列表",
      body: "检索器不能为了凑够 limit 而返回无关记忆。limit 小于等于 0 时也应立即返回空列表。这个简化算法不理解同义词，结果应忠实于明确规则，而不是猜测语义。",
      example: `if limit <= 0:
    return []`,
      bullets: ["不要修改原 memories 列表", "同分顺序必须可预测", "只截取排序后的前 limit 项"],
    },
  ],
  "agent-handoff": [
    {
      kind: "概念入门",
      title: "Handoff 把任务交给更合适的 Agent",
      body: "多 Agent 系统中，每个 Agent 声明 capabilities。handoff 根据任务需要的 capability，按顺序寻找第一个能够处理的 Agent，并生成一份稳定的交接记录。它负责路由，不负责执行任务。",
      example: `task = {
    "capability": "search",
    "description": "查找资料",
}`,
      bullets: ["sender 是发起交接者", "capability 用来匹配能力", "description 是真正交付的任务"],
    },
    {
      kind: "逐步拆解",
      title: "匹配后返回明确的交接信封",
      body: "逐个检查 task[\"capability\"] 是否在 agent[\"capabilities\"] 中。找到后返回 from、to、task 三个字段；这些字段让日志能回答谁把什么交给了谁。",
      example: `return {
    "from": sender,
    "to": agent["name"],
    "task": task["description"],
}`,
      bullets: ["选择第一个匹配者", "返回新字典", "原 task 不应被修改"],
    },
    {
      kind: "常见误区",
      title: "没有合适对象时不能假装已交接",
      body: "如果所有 Agent 都不具备所需能力，应抛出 LookupError。返回原 sender、空字符串或默认 Agent 都会制造一条看似成功但无法执行的路由。",
      example: `raise LookupError(
    f"no agent for {task['capability']}"
)`,
      bullets: ["不要静默选择不匹配者", "不要改写能力列表", "错误信息带上缺失能力"],
    },
  ],
  "agent-travel-project": [
    {
      kind: "概念入门",
      title: "工具调用之间可以存在数据依赖",
      body: "旅行助手不能并列写死天气和景点。它先调用 weather(city) 得到真实天气，其中的 condition 决定下一步 attraction(city, condition) 的输入。这是一条“前一步输出成为后一步输入”的 Agent 链。",
      example: `weather = tools["weather"](city)
condition = weather["condition"]
attractions = tools["attraction"](city, condition)`,
      bullets: ["城市传给天气工具", "天气条件传给景点工具", "每个结果来自实际调用"],
    },
    {
      kind: "逐步拆解",
      title: "trace 记录每次真实调用",
      body: "每次工具返回后，立即把 tool、input、observation 加入 trace。第二次输入包含 city 和 condition，因此使用字典表达。最终返回城市、天气、景点和完整 trace，既能展示答案，也能审计过程。",
      example: `trace.append({
    "tool": "weather",
    "input": city,
    "observation": weather,
})`,
      bullets: ["trace 顺序与执行顺序一致", "observation 保存工具原始返回值", "最终结构包含四个固定字段"],
    },
    {
      kind: "常见误区",
      title: "不要根据样例直接返回行程",
      body: "工具、城市和天气都可能变化。若只对杭州或晴天写固定结果，换一个输入就会失效。正确实现从函数参数和工具返回值逐步构造结果。",
      example: `# 错误思路：
if city == "杭州":
    return 固定答案`,
      bullets: ["两个工具各调用一次", "景点调用必须使用真实 condition", "不要遗漏可追踪的 trace"],
    },
  ],
  "agent-deep-research-project": [
    {
      kind: "概念入门",
      title: "DeepResearch 把检索结果组织成报告",
      body: "研究主题通常被拆成多个 tasks。系统对每个 task 调用 search，提取 snippet 形成发现，同时保留 url 作为引用。最终报告既有按任务分组的 sections，也有全局去重后的 sources。",
      example: `results = search(task)
findings = [item["snippet"] for item in results]
section_sources = [item["url"] for item in results]`,
      bullets: ["task 决定本次搜索问题", "snippet 是可写入报告的信息", "url 是信息来源"],
    },
    {
      kind: "逐步拆解",
      title: "每个子任务形成一个独立章节",
      body: "循环中创建 title、findings、sources 三字段的章节。章节加入 sections 后，再按出现顺序遍历本节来源；只有 url 尚未出现在全局 sources 时才追加，从而去重且保留首次出现顺序。",
      example: `if url not in sources:
    sources.append(url)`,
      bullets: ["每个 task 都对应一个 section", "章节保留自己的来源列表", "全局来源只出现一次"],
    },
    {
      kind: "常见误区",
      title: "引用不是装饰字段",
      body: "若只保留摘要而丢掉 url，报告无法追溯证据；若使用 set 直接去重，来源顺序可能不可预测。本练习要求在汇总内容时同步维护引用链。",
      example: `return {
    "topic": topic,
    "sections": sections,
    "sources": sources,
}`,
      bullets: ["空 tasks 返回空章节和空来源", "不要写死搜索结果", "返回完整报告结构"],
    },
  ],
  "agent-framework-capstone": [
    {
      kind: "概念入门",
      title: "最小 Agent 是多个已学组件的组合",
      body: "Agent 类把名称、步数上限、工具注册表和运行历史放在同一个对象中。register_tool 管理能力，run 负责解析动作、执行工具、记录观察并识别 Finish。这不是新的魔法，而是前面模块的组合。",
      example: `class Agent:
    def __init__(self, name, max_steps=5):
        self.name = name
        self.max_steps = max_steps
        self.tools = {}
        self.history = []`,
      bullets: ["状态属于具体 Agent 实例", "工具和控制循环职责分开", "max_steps 是安全边界"],
    },
    {
      kind: "逐步拆解",
      title: "每次 run 都是一段新的任务轨迹",
      body: "run 开始先重置 history，避免上一任务污染本次结果。随后最多读取 max_steps 个 action：格式无效就跳过，Finish 立即返回答案和历史，否则执行对应工具并追加 observation。返回历史副本，防止外部改写内部状态。",
      example: `self.history = []
for action_text in actions[:self.max_steps]:
    ...
return {
    "answer": answer,
    "history": self.history.copy(),
}`,
      bullets: ["每次运行历史从空开始", "Finish 不进入工具历史", "未完成时 answer 为 None"],
    },
    {
      kind: "常见误区",
      title: "框架不能用默认值掩盖配置错误",
      body: "重复工具名应抛 ValueError，未知工具应保留 KeyError。若自动返回“成功”或默认 observation，调用者会得到虚假的任务轨迹。框架的可靠性来自清晰契约和真实错误。",
      example: `if name in self.tools:
    raise ValueError("duplicate tool")

observation = self.tools[name](payload)`,
      bullets: ["不伪造未知工具结果", "不超过步数限制", "返回数据与内部历史保持一致"],
    },
  ],
};
