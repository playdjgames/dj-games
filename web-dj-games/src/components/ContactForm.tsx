import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { isLive, SITE } from "@/data/site";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.string().email("Please enter a valid email address."),
  message: z.string().min(10, "Tell us a little more — at least 10 characters."),
});

type ContactValues = z.infer<typeof schema>;

const fieldClass =
  "min-h-[52px] w-full rounded-md border border-border bg-surface-raised px-4 py-3 text-[0.95rem] text-foreground placeholder:text-muted-foreground/70 transition-colors duration-200 focus:border-signal/60 focus:outline-none";

interface ContactFormProps {
  className?: string;
}

/**
 * Contact form. Submissions open the visitor's mail client addressed to the
 * studio inbox once a real address is set in `data/site.ts`; until then the
 * form validates and explains that the inbox is not connected yet.
 */
export const ContactForm = ({ className }: ContactFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const onSubmit = useCallback(
    async (values: ContactValues): Promise<void> => {
      if (!isLive(SITE.email)) {
        toast.error("Inbox not connected yet", {
          description: "Add your business email in src/data/site.ts to start receiving messages.",
        });
        return;
      }

      const subject = encodeURIComponent(`Message from ${values.name} via DJ Games`);
      const body = encodeURIComponent(`${values.message}\n\n—\n${values.name}\n${values.email}`);
      window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;

      toast.success("Message ready to send", { description: "We opened your email app with the message drafted." });
      reset();
    },
    [reset],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-4", className)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="sr-only">
            Your name
          </label>
          <input id="contact-name" type="text" placeholder="Your name" className={fieldClass} {...register("name")} />
          {errors.name ? <p className="mt-1.5 text-xs text-destructive">{errors.name.message}</p> : null}
        </div>

        <div>
          <label htmlFor="contact-email" className="sr-only">
            Your email
          </label>
          <input
            id="contact-email"
            type="email"
            placeholder="Your email"
            className={fieldClass}
            {...register("email")}
          />
          {errors.email ? <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p> : null}
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="sr-only">
          Your message
        </label>
        <textarea
          id="contact-message"
          rows={5}
          placeholder="Your message"
          className={cn(fieldClass, "resize-y")}
          {...register("message")}
        />
        {errors.message ? <p className="mt-1.5 text-xs text-destructive">{errors.message.message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-[52px] items-center gap-2.5 rounded-md bg-signal px-7 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98] disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
        Send
        <ArrowRight size={16} />
      </button>
    </form>
  );
};
