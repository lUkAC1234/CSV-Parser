export default {
    meta: {
        type: "problem",
        docs: {
            description:
                "Disallow using @observer with React.PureComponent or React.memo/forwardRef-wrapped components",
        },
        schema: [],
    },
    create(context) {
        function isObserver(node) {
            return (
                (node.type === "Identifier" && node.name === "observer") ||
                (node.type === "MemberExpression" &&
                    node.object?.name === "mobxReact" &&
                    node.property?.name === "observer")
            );
        }

        function checkObserverCall(node) {
            if (!node.arguments || node.arguments.length === 0) return;

            const firstArg = node.arguments[0];
            if (firstArg.type !== "CallExpression") return;

            const callee = firstArg.callee;

            // memo(...)
            if (callee.type === "Identifier" && callee.name === "memo") {
                context.report({
                    node,
                    message: "observer() should not wrap memo(), remove memo() when using observer().",
                });
            }

            // React.memo(...)
            if (
                callee.type === "MemberExpression" &&
                callee.object?.name === "React" &&
                callee.property?.name === "memo"
            ) {
                context.report({
                    node,
                    message: "observer() should not wrap React.memo(), remove React.memo() when using observer().",
                });
            }

            // forwardRef(...)
            if (callee.type === "Identifier" && callee.name === "forwardRef") {
                context.report({
                    node,
                    message: "observer() should not wrap forwardRef(), wrap inside observer instead.",
                });
            }

            if (
                callee.type === "MemberExpression" &&
                callee.object?.name === "React" &&
                callee.property?.name === "forwardRef"
            ) {
                context.report({
                    node,
                    message: "observer() should not wrap React.forwardRef(), wrap inside observer instead.",
                });
            }
        }

        return {
            // Classes: @observer class X extends PureComponent
            ClassDeclaration(node) {
                if (!Array.isArray(node.decorators) || node.decorators.length === 0) return;

                const hasObserver = node.decorators.some((d) => {
                    if (d.expression?.type === "Identifier" && d.expression.name === "observer") return true;
                    if (d.expression?.type === "CallExpression" && d.expression.callee?.name === "observer")
                        return true;
                    return false;
                });

                if (!hasObserver || !node.superClass) return;

                if (node.superClass.type === "Identifier" && node.superClass.name === "PureComponent") {
                    context.report({
                        node,
                        message: "@observer should not be used with PureComponent, use Component instead.",
                    });
                }

                if (
                    node.superClass.type === "MemberExpression" &&
                    node.superClass.object?.name === "React" &&
                    node.superClass.property?.name === "PureComponent"
                ) {
                    context.report({
                        node,
                        message: "@observer should not be used with React.PureComponent, use React.Component instead.",
                    });
                }
            },

            // Functions: observer(memo(...)), observer(React.memo(...)), observer(forwardRef(...))
            CallExpression(node) {
                if (isObserver(node.callee)) {
                    checkObserverCall(node);
                }
            },
        };
    },
};
